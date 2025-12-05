import logger from "@shared/utils/logger.js"
import amqp from "amqplib"
import app from "./app.js"
import { consume_queue } from "./queue/rabbitmq.js"
import { send_push_notification } from "./utils/send_push.js"

import { config } from "@shared/config/index.js"
import {
  deregister_consul_service,
  register_consul_service,
} from "@shared/utils/consul.js"

const consul_config = {
  service_name: config.PUSH_SERVICE,
  service_port: config.PUSH_SERVICE_PORT,
  consul_host: config.CONSUL_HOST,
  consul_port: config.CONSUL_PORT,
}

async function connect_rabbit() {
  const connection = await amqp.connect(config.RABBITMQ_CONNECTION_URL)
  const channel = await connection.createChannel()
  logger.info("✅ Connected to RabbitMQ")
  return channel
}

connect_rabbit().catch(err => {
  logger.error(`❌ RabbitMQ connection failed: ${err.message}`)
  process.exit(1)
})

// Handle graceful shutdown
const graceful_shutdown = async (signal: string) => {
  logger.info(`\n🛑 Received ${signal}, shutting down gracefully...`)

  await deregister_consul_service(consul_config)
  await app.close()

  process.exit(0)
}

process.on("SIGINT", () => void graceful_shutdown("SIGINT"))
process.on("SIGTERM", () => void graceful_shutdown("SIGTERM"))

const start = async () => {
  try {
    await app.listen({ port: config.PUSH_SERVICE_PORT, host: config.HOST })
    await consume_queue(send_push_notification)
    logger.info(`Push service listening on port ${config.PUSH_SERVICE_PORT}`)

    await register_consul_service(consul_config)
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

void start()
