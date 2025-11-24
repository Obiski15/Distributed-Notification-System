import amqplib from "amqplib"
import mustache from "mustache"
import type { SendMailOptions } from "nodemailer"

import app from "../app.js"
import { fetch_template } from "../lib/helpers/fetch_template.js"
import update_notification_status from "../lib/helpers/update_notification_status.js"

let connection: amqplib.ChannelModel | null = null
let channel: amqplib.Channel | null = null

export const get_channel = async () => {
  if (!connection) {
    connection = await amqplib.connect(app.config.RABBITMQ_CONNECTION_URL)

    connection.on("error", err => {
      console.error("RabbitMQ connection error:", err)
      connection = null
      channel = null
    })

    connection.on("close", () => {
      console.log("RabbitMQ connection closed")
      connection = null
      channel = null
    })
  }

  if (!channel) {
    channel = await connection.createChannel()
  }

  return channel
}

export const consume_queue = async (
  routingKey: "email" | "push",
  callback: (data: SendMailOptions) => Promise<void>,
) => {
  const ch = await get_channel()

  // Main exchange
  ch.assertExchange("notifications.direct", "direct", {
    durable: true,
    autoDelete: false,
  })

  // Main queue with dead letter exchange configured
  await ch.assertQueue(`${routingKey}.queue`, {
    durable: true,
    autoDelete: false,
    deadLetterExchange: "notifications.direct",
    deadLetterRoutingKey: "failed",
  })

  // Create dead letter queue for failed messages
  await ch.assertQueue(`${routingKey}.failed`, {
    durable: true,
    autoDelete: false,
  })

  // Bind exchange with queues
  await ch.bindQueue(`${routingKey}.failed`, "notifications.direct", "failed")
  await ch.bindQueue(`${routingKey}.queue`, "notifications.direct", routingKey)

  let messagePriority: number = 0

  ch.consume(
    `${routingKey}.queue`,
    async (msg: any) => {
      if (msg) {
        let data: null | {
          template_code: string
          email: string
          notification_id: string
          variables: Record<string, string>
          priority: number
        } = null

        console.log(`\n📨 Received message on ${routingKey}.queue`)

        try {
          data = JSON.parse(msg.content.toString())

          if (data) {
            messagePriority = data.priority ?? 0
            // fetch template
            const template = await fetch_template(data!.template_code)

            const html = mustache.render(template.body, data.variables)

            await callback({
              to: data.email,
              subject: template.subject,
              from: "<hng.notification@gmail.com>",
              html,
            })

            // mark notification as delivered
            update_notification_status({
              status: "delivered",
              notification_id: data?.notification_id!,
            })
            ch.ack(msg)
          }
        } catch (error) {
          //  mark notification as failed
          update_notification_status({
            status: "failed",
            notification_id: data?.notification_id!,
            error: (error as Error).message,
          })
          ch.nack(msg, false, false)
          console.log(
            `💀 Message sent to Dead Letter Queue: ${routingKey}.failed\n`,
          )
        }
      }
    },
    {
      priority: messagePriority,
    },
  )
}
