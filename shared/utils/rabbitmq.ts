import amqplib from "amqplib"
import logger from "./logger.js"

let connection: amqplib.ChannelModel | null = null
let channel: amqplib.Channel | null = null

export const get_rabbitmq_channel = async (
  connection_url: string,
): Promise<amqplib.Channel> => {
  if (connection && channel) return channel

  try {
    connection = await amqplib.connect(connection_url)

    connection.on("error", (err: Error) => {
      logger.error(`RabbitMQ connection error: ${err}`)
      connection = null
      channel = null
    })

    connection.on("close", () => {
      logger.warn("RabbitMQ connection closed")
      connection = null
      channel = null
    })

    channel = await connection.createChannel()
    logger.info("✅ Connected to RabbitMQ")

    return channel
  } catch (error) {
    logger.error(`Failed to connect to RabbitMQ: ${error as Error}`)
    throw error
  }
}

export const close_rabbitmq_connection = async (): Promise<void> => {
  try {
    if (channel) {
      await channel.close()
      logger.info("✅ RabbitMQ channel closed")
      channel = null
    }
    if (connection) {
      await connection.close()
      logger.info("✅ RabbitMQ connection closed")
      connection = null
    }
  } catch (error) {
    logger.error(`Error closing RabbitMQ connection: ${error as Error}`)
    throw error
  }
}
