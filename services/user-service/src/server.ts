import { config } from "@dns/shared/config/index"
import {
  deregister_consul_service,
  register_consul_service,
} from "@dns/shared/utils/consul"
import { setup_graceful_shutdown } from "@dns/shared/utils/graceful-shutdown"
import logger from "@dns/shared/utils/logger"
import app from "./app"
import { db_destroy, db_init } from "./config/db"

const consul_config = {
  service_name: config.USER_SERVICE,
  service_port: config.USER_SERVICE_PORT,
  consul_host: config.CONSUL_HOST,
  consul_port: config.CONSUL_PORT,
}

const start = async () => {
  try {
    await app.ready()

    await db_init()

    await app.listen({ port: config.USER_SERVICE_PORT, host: config.HOST })
    logger.info(`User service listening on port ${config.USER_SERVICE_PORT}`)

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
        cleanup: db_destroy,
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
    logger.error(err, "❌ Failed to start user service")
    try {
      await app.close()
    } catch {
      // Ignore errors during cleanup
    }
    process.exit(1)
  }
}

void start()
