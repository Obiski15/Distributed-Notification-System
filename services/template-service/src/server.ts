import { config } from "@dns/shared/config/index.js"
import {
  deregister_consul_service,
  register_consul_service,
} from "@dns/shared/utils/consul.js"
import { setup_graceful_shutdown } from "@dns/shared/utils/graceful-shutdown.js"
import logger from "@dns/shared/utils/logger.js"
import app from "./app.js"
import { db_destroy, db_init } from "./config/db"

const consul_config = {
  service_name: config.TEMPLATE_SERVICE,
  service_port: config.TEMPLATE_SERVICE_PORT,
  consul_host: config.CONSUL_HOST,
  consul_port: config.CONSUL_PORT,
}

const start = async () => {
  try {
    await app.ready()
    await db_init()

    await app.listen({ port: config.TEMPLATE_SERVICE_PORT, host: config.HOST })
    logger.info(
      `Template service listening on port ${config.TEMPLATE_SERVICE_PORT}`,
    )

    await register_consul_service(consul_config)

    // Setup graceful shutdown
    setup_graceful_shutdown([
      {
        cleanup: async () => {
          await deregister_consul_service(consul_config)
        },
        timeout: 5000,
      },
      {
        cleanup: async () => {
          await db_destroy()
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
    logger.error(err, `❌ Failed to start ${config.TEMPLATE_SERVICE}`)
    try {
      await app.close()
    } catch {
      // Ignore errors during cleanup
    }
    process.exit(1)
  }
}

void start()
