import * as STATUS_CODES from "@dns/shared/constants/status-codes.js"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message.js"
import { logging_middleware } from "@dns/shared/middleware/logging.middleware.js"
import health_schema from "@dns/shared/schemas/health-schema.js"
import error_handler from "@dns/shared/utils/error_handler.js"
import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import Fastify, { FastifyReply, FastifyRequest } from "fastify"

const app = Fastify({ logger: false })

// Add logging middleware
app.addHook("onRequest", logging_middleware)

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

// Swagger setup
app.register(fastifySwagger, {
  openapi: {
    info: {
      title: "Push Service API",
      description: "API documentation for Push Service",
      version: "1.0.0",
    },
    paths: {},
  },
})
app.register(fastifySwaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "list",
    deepLinking: true,
  },
})

app.setNotFoundHandler((_request, reply) => {
  reply.status(STATUS_CODES.NOT_FOUND).send({
    success: false,
    status_code: STATUS_CODES.NOT_FOUND,
    message: SYSTEM_MESSAGES.RESOURCE_NOT_FOUND,
  })
})

app.setErrorHandler(error_handler)

export default app
