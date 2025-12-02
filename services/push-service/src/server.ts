import amqp from "amqplib"
import app from "./app.js"
import { consume_queue } from "./queue/rabbitmq.js"
import { send_push_notification } from "./utils/send_push.js"

import { config } from "@shared/config/index.js"

async function connectRabbit() {
  const connection = await amqp.connect(config.RABBITMQ_CONNECTION_URL)
  const channel = await connection.createChannel()
  console.log("✅ Connected to RabbitMQ")
  return channel
}

connectRabbit().catch(err => {
  console.error("❌ RabbitMQ connection failed:", err.message)
})

// register consul for dynamic service discovery
async function registerService() {
  const body = {
    Name: config.PUSH_SERVICE,
    ID: `${config.PUSH_SERVICE}-${config.PUSH_SERVICE_PORT}`,
    Address: config.PUSH_SERVICE,
    Port: config.PUSH_SERVICE_PORT,
    Check: {
      HTTP: `http://${config.PUSH_SERVICE}:${config.PUSH_SERVICE_PORT}/health`,
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
    `[${config.PUSH_SERVICE}] Registered with Consul at ${config.PUSH_SERVICE}:${config.PUSH_SERVICE_PORT}`,
  )
}

// Deregister service from Consul on shutdown
async function deregisterService() {
  const serviceId = `${config.PUSH_SERVICE}-${config.PUSH_SERVICE_PORT}`

  try {
    await fetch(
      `http://${config.CONSUL_HOST}:${config.CONSUL_PORT}/v1/agent/service/deregister/${serviceId}`,
      { method: "PUT" },
    )
    console.log(`[${config.PUSH_SERVICE}] Deregistered from Consul`)
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
    await app.listen({ port: config.PUSH_SERVICE_PORT, host: config.HOST })
    await consume_queue(send_push_notification)
    console.log(`Push service listening on port ${config.PUSH_SERVICE_PORT}`)

    await registerService()
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
