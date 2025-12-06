import logger from "@dns/shared/utils/logger"
import { sanitize_object } from "@dns/shared/utils/sanitizer"
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common"
import { FastifyReply, FastifyRequest } from "fastify"
import { Observable } from "rxjs"
import { tap } from "rxjs/operators"

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const start_time = Date.now()
    const http_context = context.switchToHttp()
    const request = http_context.getRequest<FastifyRequest>()
    const response = http_context.getResponse<FastifyReply>()

    const { method, url, headers, body } = request

    // Sanitize headers and body
    const sanitized_headers = sanitize_object(
      headers as Record<string, unknown>,
    )
    const sanitized_body = body
      ? sanitize_object(body as Record<string, unknown>)
      : null

    // Log request
    logger.info({
      type: "REQUEST",
      method,
      url,
      headers: sanitized_headers,
      body: sanitized_body,
    })

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          const duration = Date.now() - start_time
          const status_code = response.statusCode

          // Sanitize response data
          const sanitized_response = data
            ? sanitize_object(data as Record<string, unknown>)
            : null

          // Log response
          logger.info({
            type: "RESPONSE",
            method,
            url,
            status_code,
            duration: `${duration}ms`,
            body: sanitized_response,
          })
        },
        error: (error: Error) => {
          const duration = Date.now() - start_time
          const status_code = response.statusCode

          // Log error response
          logger.error({
            type: "RESPONSE_ERROR",
            method,
            url,
            status_code,
            duration: `${duration}ms`,
            error: error.message,
          })
        },
      }),
    )
  }
}
