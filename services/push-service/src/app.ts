import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import * as STATUS_CODES from "@shared/constants/status-codes.js"
import * as SYSTEM_MESSAGES from "@shared/constants/system-message.js"
import health_schema from "@shared/schemas/health-schema.js"
import error_handler from "@shared/utils/error_handler.js"
import Fastify, { FastifyReply, FastifyRequest } from "fastify"

const app = Fastify({ logger: false })

// Register Swagger
await app.register(swagger, {
  swagger: {
    info: {
      title: "Push Service API",
      description: "API documentation for Push Notification Service",
      version: "1.0.0",
      contact: {
        name: "Push Service Team",
        email: "support@example.com",
      },
    },
    host: "localhost:3003",
    schemes: ["http", "https"],
    consumes: ["application/json"],
    produces: ["application/json"],
    tags: [
      {
        name: "Push Notifications",
        description: "Push notification operations",
      },
      { name: "Health", description: "Health check endpoints" },
    ],
  },
})

// Register Swagger UI
await app.register(swaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: false,
  },
})

app.get(
  "/health",
  {
    schema: health_schema,
  },
  async (_request: FastifyRequest, reply: FastifyReply) => {
    reply.send({
      success: true,
      status_code: STATUS_CODES.OK,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  },
)

app.setNotFoundHandler((_request, reply) => {
  reply.status(STATUS_CODES.NOT_FOUND).send({
    success: false,
    status_code: STATUS_CODES.NOT_FOUND,
    message: SYSTEM_MESSAGES.RESOURCE_NOT_FOUND,
  })
})

app.setErrorHandler(error_handler)

export default app
