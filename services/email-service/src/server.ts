import { config } from "@dns/shared/config/index"
import {
  deregister_consul_service,
  register_consul_service,
} from "@dns/shared/utils/consul"
import { setup_graceful_shutdown } from "@dns/shared/utils/graceful-shutdown"
import logger from "@dns/shared/utils/logger"

import app from "./app"
import send_mail from "./lib/helpers/send_mail"
import { close_connection, consume_queue } from "./queue/rabbitmq"

const consul_config = {
  service_name: config.EMAIL_SERVICE,
  service_port: config.EMAIL_SERVICE_PORT,
  consul_host: config.CONSUL_HOST,
  consul_port: config.CONSUL_PORT,
}

const start = async () => {
  try {
    await app.listen({ port: config.EMAIL_SERVICE_PORT, host: config.HOST })
    logger.info(`Email service listening on port ${config.EMAIL_SERVICE_PORT}`)

    await consume_queue(send_mail)
    await register_consul_service(consul_config)

    logger.info("✅ Email service started successfully")

    // Setup graceful shutdown ONLY after successful startup
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
    logger.error(err, `❌ Failed to start ${config.EMAIL_SERVICE}`)
    // Close app and connections before exit
    try {
      await app.close()
    } catch {
      // Ignore errors during cleanup
    }
    process.exit(1)
  }
}

void start()
