import logger from "@dns/shared/utils/logger.js"
import app from "./app.js"
import { close_connection, consume_queue } from "./queue/rabbitmq.js"
import { send_push_notification } from "./utils/send_push.js"

import { config } from "@dns/shared/config/index.js"
import {
  deregister_consul_service,
  register_consul_service,
} from "@dns/shared/utils/consul.js"
import { setup_graceful_shutdown } from "@dns/shared/utils/graceful-shutdown.js"

const consul_config = {
  service_name: config.PUSH_SERVICE,
  service_port: config.PUSH_SERVICE_PORT,
  consul_host: config.CONSUL_HOST,
  consul_port: config.CONSUL_PORT,
}

const start = async () => {
  try {
    await app.listen({ port: config.PUSH_SERVICE_PORT, host: config.HOST })
    logger.info(`Push service listening on port ${config.PUSH_SERVICE_PORT}`)

    await consume_queue(send_push_notification)
    await register_consul_service(consul_config)

    logger.info("✅ Push service started successfully")

    // graceful shutdown
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
    logger.error(err, `❌ Failed to start ${config.PUSH_SERVICE}`)
    try {
      await app.close()
    } catch {
      // Ignore errors during cleanup
    }
    process.exit(1)
  }
}

void start()
