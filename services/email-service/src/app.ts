import fastifySwagger from "@fastify/swagger"
import fastifySwaggerUi from "@fastify/swagger-ui"
import Fastify from "fastify"

import * as STATUS_CODES from "@dns/shared/constants/status-codes"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import { logging_middleware } from "@dns/shared/middleware/logging.middleware"
import health_schema from "@dns/shared/schemas/health-schema"
import error_handler from "@dns/shared/utils/error_handler"

const app = Fastify({ logger: false })

// Add logging middleware
app.addHook("preHandler", logging_middleware)

app.setNotFoundHandler((_request, reply) => {
  reply.status(STATUS_CODES.NOT_FOUND).send({
    success: false,
    status_code: STATUS_CODES.NOT_FOUND,
    message: SYSTEM_MESSAGES.RESOURCE_NOT_FOUND,
  })
})

app.setErrorHandler(error_handler)

app.get(
  "/health",
  {
    schema: health_schema,
  },
  async (_request, reply) => {
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
      title: "Email Service API",
      description: "API documentation for Email Service",
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

export default app
