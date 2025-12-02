import { config } from "@shared/config/index.js"
import app from "./app.js"
import send_mail from "./lib/helpers/send_mail.js"
import { consume_queue } from "./queue/rabbitmq.js"

// Register service with Consul
async function registerService() {
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

  console.log(
    `[${config.EMAIL_SERVICE}] Registered with Consul at ${config.CONSUL_HOST}:${config.CONSUL_PORT}`,
  )
}

async function deregisterService() {
  const serviceId = `${config.EMAIL_SERVICE}-${config.EMAIL_SERVICE_PORT}`

  try {
    await fetch(
      `http://${config.CONSUL_HOST}:${config.CONSUL_PORT}/v1/agent/service/deregister/${serviceId}`,
      { method: "PUT" },
    )
    console.log(`[${config.EMAIL_SERVICE}] Deregistered from Consul`)
  } catch (err) {
    console.error("Failed to deregister from Consul:", err)
  }
}

// Handle graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`)

  await deregisterService()
  await app.close()

  process.exit(0)
}

process.on("SIGINT", () => void gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"))

const start = async () => {
  try {
    await app.listen({ port: config.EMAIL_SERVICE_PORT, host: config.HOST })
    await consume_queue(send_mail)
    console.log(`Email service listening on port ${config.EMAIL_SERVICE_PORT}`)

    await registerService()
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
