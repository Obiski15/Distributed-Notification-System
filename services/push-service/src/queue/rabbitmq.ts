import amqplib from "amqplib"
import app from "../app.js"
import {
  validate_device_token,
  type PushNotificationPayload,
} from "../utils/send_push.js"

let connection: amqplib.ChannelModel | null = null
let channel: amqplib.Channel | null = null

export const get_channel = async () => {
  if (!connection) {
    connection = await amqplib.connect(app.config.RABBITMQ_CONNECTION_URL)

    connection.on("error", (err: any) => {
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
  callback: (data: PushNotificationPayload) => Promise<void>,
) => {
  const routingKey = "push"

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

  ch.consume(`${routingKey}.queue`, async (msg: any) => {
    if (msg) {
      console.log(`\n📨 Received message on ${routingKey}.queue`)

      try {
        const data = JSON.parse(msg.content.toString()) as {
          template_code: string
          push_tokens: string[]
          priority: number
          user_id?: string
          title?: string
          metadata?: Record<string, string>
        }

        if (!data.push_tokens.length) {
          console.error("No push tokens provided")
          ch.nack(msg, false, false)
          return
        }

        console.log(data.push_tokens)

        for (const token of data.push_tokens) {
          const isValidToken = await validate_device_token(token)

          if (!isValidToken) {
            console.error(`Invalid device token: ${token}`)
            ch.nack(msg, false, false)
            return
          }

          const pushPayload: PushNotificationPayload = {
            token,
            title: "Notification",
            body: "You have a new notification",
            image: `https://picsum.photos/${randomNumber(500, 599)}`,
            link: "https://example.com",
            data: {
              ...data.metadata,
              ...(data.user_id && { user_id: data.user_id }),
              template_code: data.template_code,
            },
            priority: data.priority > 5 ? "high" : "normal",
            ttl: 86400,
          }

          console.log("Sending push notification:", pushPayload)

          await callback(pushPayload)
        }

        ch.ack(msg)
        console.log(`✅ Push notification(s) sent successfully`)
      } catch (error) {
        console.error("❌ Error processing push notification:", error)
        ch.nack(msg, false, false)
        console.log(
          `💀 Message sent to Dead Letter Queue: ${routingKey}.failed\n`,
        )
      }
    }
  })
}

const randomNumber = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
