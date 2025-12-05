import logger from "@shared/utils/logger.js"
import amqp from "amqplib"
import app from "./app.js"
import { close_connection, consume_queue } from "./queue/rabbitmq.js"
import { send_push_notification } from "./utils/send_push.js"

import { config } from "@shared/config/index.js"
import {
  deregister_consul_service,
  register_consul_service,
} from "@shared/utils/consul.js"
import { setup_graceful_shutdown } from "@shared/utils/graceful-shutdown.js"

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

const start = async () => {
  try {
    await app.listen({ port: config.PUSH_SERVICE_PORT, host: config.HOST })
    await consume_queue(send_push_notification)
    logger.info(`Push service listening on port ${config.PUSH_SERVICE_PORT}`)

    await register_consul_service(consul_config)

    // Setup graceful shutdown
    setup_graceful_shutdown([
      {
        cleanup: async () => {
          await close_connection()
        },
        timeout: 5000,
      },
      {
        cleanup: async () => {
          await deregister_consul_service(consul_config)
        },
        timeout: 5000,
      },
      {
        cleanup: async () => {
          await app.close()
        },
        timeout: 10000,
      },
    ])
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

void start()
