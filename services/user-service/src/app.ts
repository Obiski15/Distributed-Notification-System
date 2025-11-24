import env from "@fastify/env"
import jwt from "@fastify/jwt"
import mysql from "@fastify/mysql"
import swagger from "@fastify/swagger"
import swaggerUi from "@fastify/swagger-ui"
import Fastify from "fastify"

import error_handler from "./lib/utils/error_handler.js"
import auth_routes from "./routes/auth.routes.js"
import user_route from "./routes/user.routes.js"
import env_schema from "./schema/env.schema.js"

const app = Fastify({ logger: true })

await app.register(env, {
  confKey: "config",
  schema: env_schema,
  dotenv: true,
})

await app.register(swagger, {
  openapi: {
    info: {
      title: "User Service",
      version: "1.0.0",
    },
    servers: [{ url: "http://localhost:" + app.config.PORT }],
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

await app.register(mysql, {
  promise: true,
  connectionString: app.config.DB_URL,
})

app.register(jwt, {
  secret: app.config.JWT_SECRET,
})

app.register(auth_routes, { prefix: "/api/v1/auth" })
app.register(user_route, { prefix: "/api/v1/users" })

app.get(
  "/health",
  {
    schema: {
      description: "Check if the user service is healthy.",
      tags: ["Health"],
      response: {
        200: {
          type: "object",
          properties: {
            success: { type: "boolean" },
            message: { type: "string", example: "ok" },
          },
        },
      },
    },
  },
  async (_request, reply) => {
    reply.send({ success: true, message: "ok" })
  },
)

app.setNotFoundHandler((_request, reply) => {
  reply.status(404).send({
    success: false,
    statusCode: 404,
    message: "Not Found",
  })
})

app.setErrorHandler(error_handler)

export default app
