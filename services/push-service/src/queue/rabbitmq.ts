import { ConsumeMessage } from "amqplib"
import mustache from "mustache"

import { config } from "@dns/shared/config/index"
import { fetch_template } from "@dns/shared/helpers/fetch_template"
import update_notification_status from "@dns/shared/helpers/update_notification_status"
import logger from "@dns/shared/utils/logger"
import {
  close_rabbitmq_connection,
  get_rabbitmq_channel,
} from "@dns/shared/utils/rabbitmq"

import {
  validate_device_token,
  type PushNotificationPayload,
} from "../utils/send_push"

interface PushQueueMessage {
  template_code: string
  push_tokens: string[]
  priority: number
  user_id?: string
  request_id: string
  variables?: Record<string, string>
}

export const get_channel = () =>
  get_rabbitmq_channel(config.RABBITMQ_CONNECTION_URL)

export const close_connection = close_rabbitmq_connection

export const consume_queue = async (
  callback: (data: PushNotificationPayload) => Promise<void>,
) => {
  const ch = await get_channel()
  const mainKey = config.PUSH_ROUTING_KEY
  const waitKey = `${mainKey}.wait`
  const failedKey = `${mainKey}.failed`

  // Exchange
  await ch.assertExchange(config.NOTIFICATION_EXCHANGE, "topic", {
    durable: true,
    autoDelete: false,
  })

  // Main Queue
  await ch.assertQueue(`${mainKey}.queue`, {
    durable: true,
    deadLetterExchange: config.NOTIFICATION_EXCHANGE,
    deadLetterRoutingKey: failedKey,
  })
  await ch.bindQueue(`${mainKey}.queue`, config.NOTIFICATION_EXCHANGE, mainKey)

  // Wait Queue
  // Messages sit here for 20s, then go BACK to "push" (mainKey)
  await ch.assertQueue(`${mainKey}.wait`, {
    durable: true,
    messageTtl: config.NOTIFICATION_RETRY_DELAY,
    deadLetterExchange: config.NOTIFICATION_EXCHANGE,
    deadLetterRoutingKey: mainKey,
  })
  await ch.bindQueue(`${mainKey}.wait`, config.NOTIFICATION_EXCHANGE, waitKey)

  // Failed Queue
  await ch.assertQueue(`${mainKey}.failed`, {
    durable: true,
  })
  await ch.bindQueue(
    `${mainKey}.failed`,
    config.NOTIFICATION_EXCHANGE,
    failedKey,
  )

  logger.info(`🐰 Waiting for messages in ${mainKey}.queue`)

  // Limit unacknowledged messages to 10
  await ch.prefetch(10)

  await ch.consume(`${mainKey}.queue`, (msg: ConsumeMessage | null) => {
    if (msg) {
      const data = JSON.parse(msg.content.toString()) as PushQueueMessage
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ;(async () => {
        try {
          if (
            !Array.isArray(data.push_tokens) ||
            data.push_tokens.length === 0
          ) {
            logger.error("❌ Malformed message: No push tokens")
            ch.nack(msg, false, false)
            return
          }

          const valid_promises = data.push_tokens.map(async token => {
            const isValidToken = await validate_device_token(token)

            if (!isValidToken) {
              logger.error(`Skipping invalid device token: ${token}`)
              return null
            }

            const template = await fetch_template(data.template_code)

            const html = mustache.render(
              template.body || "",
              data.variables || {},
            )
            const subject = mustache.render(
              template.subject || "",
              data.variables || {},
            )
            const action_url = mustache.render(
              template.action_url || "",
              data.variables || {},
            )

            const pushPayload: PushNotificationPayload = {
              token,
              title: subject,
              body: html,
              image: template.image_url!,
              link: action_url || "",
              data: {
                ...(template.metadata || {}),
                ...(data.user_id && { user_id: data.user_id }),
                template_code: data.template_code,
              },
              priority: data.priority > 5 ? "high" : "normal",
              ttl: 86400,
            }

            try {
              await callback(pushPayload)
              return token
            } catch (err) {
              logger.error(
                `❌ Failed to send to token ${token}: ${err as Error}`,
              )
              return null
            }
          })

          await Promise.all(valid_promises)

          ch.ack(msg)
          logger.info(
            `✅ Batch processed for ${data.push_tokens.length} tokens`,
          )
          await update_notification_status({
            status: "delivered",
            request_id: data.request_id,
          })
        } catch (error) {
          if (error instanceof SyntaxError) {
            logger.error(
              "❌ Fatal JSON Parse Error. Sending to DLQ immediately.",
            )
            ch.nack(msg, false, false)
            return
          }

          const headers = msg.properties.headers || {}
          const retryCount = (headers["x-retry-count"] || 0) as number

          if (retryCount < config.NOTIFICATION_MAX_RETRIES) {
            logger.warn(
              `⚠️ Retrying (${retryCount + 1}/${config.NOTIFICATION_MAX_RETRIES})...`,
            )

            ch.publish(config.NOTIFICATION_EXCHANGE, waitKey, msg.content, {
              persistent: true,
              headers: { "x-retry-count": retryCount + 1 },
            })

            // Ack the original (we made a copy in the wait queue)
            ch.ack(msg)
          } else {
            logger.error(error, `💀 Max retries. Sending to Dead Letter.`)
            await update_notification_status({
              status: "failed",
              request_id: data.request_id,
              error: (error as Error)?.message ?? "Unknown error",
            })
            ch.nack(msg, false, false)
          }
        }
      })()
    }
  })
}
