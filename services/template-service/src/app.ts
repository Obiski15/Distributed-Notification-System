import mysql from "@fastify/mysql"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import Fastify from "fastify"

import { config } from "@dns/shared/config/index.js"
import * as STATUS_CODES from "@dns/shared/constants/status-codes.js"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message.js"
import { logging_middleware } from "@dns/shared/middleware/logging.middleware.js"
import health_schema from "@dns/shared/schemas/health-schema.js"
import error_handler from "@dns/shared/utils/error_handler.js"

import template_routes from "./routes/template_route.js"

const app = Fastify({ logger: false })

// Add logging middleware
app.addHook("onRequest", logging_middleware)

await app.register(swagger, {
  openapi: {
    info: {
      title: "Template Service",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:" + config.TEMPLATE_SERVICE_PORT }],
  },
})

await app.register(swaggerUi, {
  routePrefix: "/docs",
  uiConfig: {
    docExpansion: "full",
    deepLinking: false,
  },
  staticCSP: true,
})

app.register(mysql, {
  promise: true,
  connectionString: config.TEMPLATE_SERVICE_DB,
})

app.register(template_routes, { prefix: "/api/v1/templates" })

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

app.setNotFoundHandler((_request, reply) => {
  reply.status(STATUS_CODES.NOT_FOUND).send({
    success: false,
    status_code: STATUS_CODES.NOT_FOUND,
    message: SYSTEM_MESSAGES.RESOURCE_NOT_FOUND,
  })
})

app.setErrorHandler(error_handler)

export default app
