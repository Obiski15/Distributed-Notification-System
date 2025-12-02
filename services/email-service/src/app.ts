import Fastify from "fastify"

const app = Fastify({ logger: false })

import * as STATUS_CODES from "@shared/constants/status-codes.js"
import * as SYSTEM_MESSAGES from "@shared/constants/system-message.js"
import health_schema from "@shared/schemas/health-schema.js"
import error_handler from "@shared/utils/error_handler.js"

app.setNotFoundHandler((_request, reply) => {
  reply.status(STATUS_CODES.NOT_FOUND).send({
    success: false,
    status_code: STATUS_CODES.NOT_FOUND,
    message: SYSTEM_MESSAGES.RESOURCE_NOT_FOUND,
  })
})

app.setErrorHandler(error_handler)

app.get("/health", { schema: health_schema }, async (_request, reply) => {
  reply.send({
    success: true,
    status_code: STATUS_CODES.OK,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  })
})

export default app
