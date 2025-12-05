import { config } from "@shared/config/index.js"
import {
  deregister_consul_service,
  register_consul_service,
} from "@shared/utils/consul.js"
import logger from "@shared/utils/logger.js"

import app from "./app.js"
import send_mail from "./lib/helpers/send_mail.js"
import { consume_queue } from "./queue/rabbitmq.js"

const consul_config = {
  service_name: config.EMAIL_SERVICE,
  service_port: config.EMAIL_SERVICE_PORT,
  consul_host: config.CONSUL_HOST,
  consul_port: config.CONSUL_PORT,
}

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
    await app.listen({ port: config.EMAIL_SERVICE_PORT, host: config.HOST })
    await consume_queue(send_mail)
    logger.info(`Email service listening on port ${config.EMAIL_SERVICE_PORT}`)

    await register_consul_service(consul_config)
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

void start()
