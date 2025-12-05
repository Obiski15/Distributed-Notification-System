import { config } from "@shared/config/index.js"
import logger from "@shared/utils/logger.js"
import app from "./app.js"

// register consul for dynamic service discovery
async function registerService() {
  const body = {
    Name: config.USER_SERVICE,
    ID: `${config.USER_SERVICE}-${config.USER_SERVICE_PORT}`,
    Address: config.USER_SERVICE,
    Port: config.USER_SERVICE_PORT,
    Check: {
      HTTP: `http://${config.USER_SERVICE}:${config.USER_SERVICE_PORT}/health`,
      Interval: "10s",
    },
  }

  await fetch(
    `http://${config.CONSUL_HOST}:${config.CONSUL_PORT}/v1/agent/service/register`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  )

  logger.info(
    `[${config.USER_SERVICE}] Registered with Consul at ${config.USER_SERVICE}:${config.USER_SERVICE_PORT}`,
  )
}

// Deregister service from Consul on shutdown
async function deregisterService() {
  const serviceId = `${config.USER_SERVICE}-${config.USER_SERVICE_PORT}`

  try {
    await fetch(
      `http://${config.CONSUL_HOST}:${config.CONSUL_PORT}/v1/agent/service/deregister/${serviceId}`,
      { method: "PUT" },
    )
    logger.info(`[${config.USER_SERVICE}] Deregistered from Consul`)
  } catch (err) {
    logger.error(`Failed to deregister from Consul: ${err as Error}`)
  }
}

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`\n🛑 Received ${signal}, shutting down gracefully...`)

  await deregisterService()
  await app.close()

  process.exit(0)
}

process.on("SIGINT", () => void gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"))

const start = async () => {
  try {
    await app.ready()

    await app.listen({ port: config.USER_SERVICE_PORT, host: config.HOST })
    logger.info(`User service listening on port ${config.USER_SERVICE_PORT}`)

    await registerService()
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

void start()
