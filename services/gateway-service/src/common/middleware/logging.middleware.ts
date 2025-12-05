import { Injectable, NestMiddleware } from "@nestjs/common"
import logger from "@shared/utils/logger"
import { sanitize_object } from "@shared/utils/sanitizer"
import { FastifyReply, FastifyRequest } from "fastify"

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  use(req: FastifyRequest["raw"], res: FastifyReply["raw"], next: () => void) {
    const start_time = Date.now()
    const { method, url } = req

    // Sanitize headers
    const sanitized_headers = sanitize_object(
      req.headers as Record<string, unknown>,
    )

    // Sanitize request body
    const sanitized_body = sanitize_object(
      (req as unknown as FastifyRequest).body as Record<string, unknown>,
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

    // Capture response
    const original_write = res.write.bind(res)
    const original_end = res.end.bind(res)
    const chunks: Buffer[] = []

    res.write = function (chunk: unknown, ...args: unknown[]): boolean {
      if (chunk) {
        chunks.push(Buffer.from(chunk as Buffer))
      }
      return original_write(chunk, ...(args as [BufferEncoding]))
    }

    res.end = ((chunk: unknown, ...args: unknown[]) => {
      if (chunk) {
        chunks.push(Buffer.from(chunk as Buffer))
      }

      const duration = Date.now() - start_time
      const status_code = res.statusCode

      let response_body: unknown = null
      try {
        const body_string = Buffer.concat(chunks).toString("utf8")
        response_body = body_string ? JSON.parse(body_string) : null
      } catch {
        response_body = Buffer.concat(chunks).toString("utf8")
      }

      // Sanitize response body
      const sanitized_response = sanitize_object(
        response_body as Record<string, unknown>,
      )

      // Log response
      logger.info({
        type: "RESPONSE",
        method,
        url,
        status_code,
        duration: `${duration}ms`,
        body: sanitized_response,
        timestamp: new Date().toISOString(),
      })

      original_end(chunk, ...(args as [BufferEncoding]))
    }) as typeof res.end

    next()
  }
}
