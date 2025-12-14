import jwt from "@fastify/jwt"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import Fastify from "fastify"

import { config } from "@dns/shared/config/index"
import error_handler from "@dns/shared/utils/error_handler"
import auth_routes from "./routes/auth.routes"
import user_route from "./routes/user.routes"

import * as STATUS_CODES from "@dns/shared/constants/status-codes"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import { logging_middleware } from "@dns/shared/middleware/logging.middleware"
import health_schema from "@dns/shared/schemas/health-schema"

const app = Fastify({
  logger: { level: "error" },
})

// Add logging middleware
app.addHook("preHandler", logging_middleware)

await app.register(swagger, {
  openapi: {
    info: {
      title: "User Service",
      version: "1.0.0",
    },
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

await app.register(jwt, {
  namespace: "access",
  secret: config.JWT_ACCESS_SECRET,
  sign: { expiresIn: config.JWT_ACCESS_SECRET_EXPIRES_IN },
})

await app.register(jwt, {
  namespace: "refresh",
  secret: config.JWT_REFRESH_SECRET,
  sign: { expiresIn: config.JWT_REFRESH_SECRET_EXPIRES_IN },
})

app.register(auth_routes, { prefix: "/api/v1/auth" })
app.register(user_route, { prefix: "/api/v1/users" })

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
