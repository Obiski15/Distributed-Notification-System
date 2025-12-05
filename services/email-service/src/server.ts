import { config } from "@shared/config/index.js"
import logger from "@shared/utils/logger.js"

import app from "./app.js"
import send_mail from "./lib/helpers/send_mail.js"
import { consume_queue } from "./queue/rabbitmq.js"

// Register service with Consul
async function register_service() {
  const body = {
    Name: config.EMAIL_SERVICE,
    ID: `${config.EMAIL_SERVICE}-${config.EMAIL_SERVICE_PORT}`,
    Address: config.EMAIL_SERVICE,
    Port: config.EMAIL_SERVICE_PORT,
    Check: {
      HTTP: `http://${config.EMAIL_SERVICE}:${config.EMAIL_SERVICE_PORT}/health`,
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
    `[${config.EMAIL_SERVICE}] Registered with Consul at ${config.CONSUL_HOST}:${config.CONSUL_PORT}`,
  )
}

async function deregister_service() {
  const service_id = `${config.EMAIL_SERVICE}-${config.EMAIL_SERVICE_PORT}`

  try {
    await fetch(
      `http://${config.CONSUL_HOST}:${config.CONSUL_PORT}/v1/agent/service/deregister/${service_id}`,
      { method: "PUT" },
    )
    logger.info(`[${config.EMAIL_SERVICE}] Deregistered from Consul`)
  } catch (err) {
    logger.error(`Failed to deregister from Consul:, ${err as Error}`)
  }
}

// Handle graceful shutdown
const graceful_shutdown = async (signal: string) => {
  logger.info(`\n🛑 Received ${signal}, shutting down gracefully...`)

  await deregister_service()
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

    await register_service()
  } catch (err) {
    logger.error(err)
    process.exit(1)
  }
}

void start()
