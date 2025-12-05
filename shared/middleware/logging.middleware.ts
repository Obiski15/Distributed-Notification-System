import { FastifyReply, FastifyRequest } from "fastify"
import logger from "../utils/logger.js"
import { sanitize_object } from "../utils/sanitizer.js"

export function logging_middleware(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const start_time = Date.now()
  const { method, url } = request

  // Sanitize headers
  const sanitized_headers = sanitize_object(
    request.headers as Record<string, unknown>,
  )

  // Sanitize request body
  const sanitized_body = sanitize_object(
    request.body as Record<string, unknown>,
  )

  // Log request
  logger.info({
    type: "REQUEST",
    method,
    url,
    headers: sanitized_headers,
    body: sanitized_body,
    timestamp: new Date().toISOString(),
  })

  // Hook to log response
  reply.raw.on("finish", () => {
    const duration = Date.now() - start_time
    const status_code = reply.statusCode

    // Log response
    logger.info({
      type: "RESPONSE",
      method,
      url,
      status_code,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })
  })
}
