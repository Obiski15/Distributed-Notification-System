import amqplib, { ConsumeMessage } from "amqplib"
import mustache from "mustache"
import type { SendMailOptions } from "nodemailer"

import { config } from "@shared/config/index.js"
import { fetch_template } from "../lib/helpers/fetch_template.js"
import update_notification_status from "../lib/helpers/update_notification_status.js"

interface EmailQueueMessage {
  template_code: string
  email: string
  request_id: string
  variables: Record<string, string>
  priority?: number
}

const EXCHANGE_NAME = config.NOTIFICATION_EXCHANGE
const RETRY_DELAY_MS = config.NOTIFICATION_RETRY_DELAY
const MAX_RETRIES = config.NOTIFICATION_MAX_RETRIES

let connection: amqplib.ChannelModel | null = null
let channel: amqplib.Channel | null = null

export const get_channel = async (): Promise<amqplib.Channel> => {
  if (connection && channel) return channel

  try {
    connection = await amqplib.connect(config.RABBITMQ_CONNECTION_URL)

    connection.on("error", (err: Error) => {
      console.error("RabbitMQ connection error:", err)
      connection = null
      channel = null
    })

    connection.on("close", () => {
      console.warn("RabbitMQ connection closed")
      connection = null
      channel = null
    })

    channel = await connection.createChannel()

    return channel
  } catch (error) {
    console.error("Failed to connect to RabbitMQ", error)
    throw error
  }
}

export const consume_queue = async (
  callback: (data: SendMailOptions) => Promise<void>,
): Promise<void> => {
  const ch = await get_channel()

  const mainKey = config.EMAIL_ROUTING_KEY
  const waitKey = `${mainKey}.wait`
  const failedKey = `${mainKey}.failed`

  // Assert Exchange
  await ch.assertExchange(EXCHANGE_NAME, "topic", {
    durable: true,
    autoDelete: false,
  })

  // Main Queue
  await ch.assertQueue(`${mainKey}.queue`, {
    durable: true,
    deadLetterExchange: EXCHANGE_NAME,
    deadLetterRoutingKey: failedKey,
  })
  await ch.bindQueue(`${mainKey}.queue`, EXCHANGE_NAME, mainKey)

  // Wait Queue
  await ch.assertQueue(`${mainKey}.wait`, {
    durable: true,
    messageTtl: RETRY_DELAY_MS,
    deadLetterExchange: EXCHANGE_NAME,
    deadLetterRoutingKey: mainKey,
  })
  await ch.bindQueue(`${mainKey}.wait`, EXCHANGE_NAME, waitKey)

  // Failed Queue
  await ch.assertQueue(`${mainKey}.failed`, { durable: true })
  await ch.bindQueue(`${mainKey}.failed`, EXCHANGE_NAME, failedKey)

  console.log(`🐰 Waiting for messages in ${mainKey}.queue`)

  //  Limit unacknowledged messages to 10
  await ch.prefetch(10)

  await ch.consume(`${mainKey}.queue`, (msg: ConsumeMessage | null) => {
    if (msg) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ;(async () => {
        let parsedData: EmailQueueMessage | null = null

        try {
          parsedData = JSON.parse(msg.content.toString()) as EmailQueueMessage

          const { template_code, email, request_id, variables } = parsedData

          if (!email || !template_code) {
            console.error(
              "❌ Malformed message: Missing email or template_code",
            )
            ch.nack(msg, false, false)
            return
          }

          console.log(
            `📨 Processing email for ${email} (Template: ${template_code})`,
          )

          const template = await fetch_template(template_code)

          const html = mustache.render(template.body || "", variables || {})
          const subject = mustache.render(
            template.subject || "",
            variables || {},
          )

          await callback({
            to: email,
            subject: subject,
            from: config.SMTP_FROM,
            html,
          })

          await update_notification_status({
            status: "delivered",
            request_id,
          })

          ch.ack(msg)
          console.log(`✅ Email sent successfully to ${email}`)
        } catch (error) {
          console.error("❌ Error processing email:", error)

          // RETRY LOGIC
          if (error instanceof SyntaxError) {
            console.error("Fatal JSON error. Sending to DLQ.")
            return
          }

          // Check if service is down
          if (
            String(error).toString().includes(config.GATEWAY_SERVICE) ||
            String(error).toString().includes(config.TEMPLATE_SERVICE)
          )
            return ch.nack(msg, false, false)

          const headers = msg.properties.headers || {}
          const retryCount = (headers["x-retry-count"] || 0) as number

          if (retryCount < MAX_RETRIES) {
            console.warn(
              `⏳ Retrying (${
                retryCount + 1
              }/${MAX_RETRIES})... sending to ${waitKey}`,
            )

            ch.publish(EXCHANGE_NAME, waitKey, msg.content, {
              persistent: true,
              headers: { "x-retry-count": retryCount + 1 },
            })

            ch.ack(msg)
          } else {
            console.error(`💀 Max retries reached. Sending to Dead Letter.`)

            // Update DB status if we have the ID from the partial parse
            if (parsedData?.request_id) {
              await update_notification_status({
                status: "failed",
                request_id: parsedData.request_id,
                error: (error as Error)?.message ?? "Unknown error",
              }).catch((e: unknown) =>
                console.error("Failed to update status DB:", e),
              )
            }

            ch.nack(msg, false, false)
          }
        }
      })()
    }
  })
}
