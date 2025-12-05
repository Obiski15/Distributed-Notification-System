import { config } from "@shared/config/index.js"
import {
  deregister_consul_service,
  register_consul_service,
} from "@shared/utils/consul.js"
import { setup_graceful_shutdown } from "@shared/utils/graceful-shutdown.js"
import logger from "@shared/utils/logger.js"

import app from "./app.js"
import send_mail from "./lib/helpers/send_mail.js"
import { close_connection, consume_queue } from "./queue/rabbitmq.js"

const consul_config = {
  service_name: config.EMAIL_SERVICE,
  service_port: config.EMAIL_SERVICE_PORT,
  consul_host: config.CONSUL_HOST,
  consul_port: config.CONSUL_PORT,
}

const start = async () => {
  try {
    await app.listen({ port: config.EMAIL_SERVICE_PORT, host: config.HOST })
    await consume_queue(send_mail)
    logger.info(`Email service listening on port ${config.EMAIL_SERVICE_PORT}`)

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
