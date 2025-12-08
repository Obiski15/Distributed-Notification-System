import * as ERROR_CODES from "@dns/shared/constants/error-codes"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import type { IError } from "@dns/shared/types"
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common"
import { isAxiosError } from "axios"
import { FastifyReply, FastifyRequest } from "fastify"
import { CustomException } from "../custom/custom-exceptions"

import { config } from "@dns/shared/config/index"
import logger from "@dns/shared/utils/logger"

interface ErrorResponse {
  success: false
  status_code: number
  message: string
  error_code?: string
  details?: any
  timestamp: string
  path: string
  request_id?: string
  stack?: string
}

@Catch()
export class GlobalFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const reply = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()

    let status_code: number = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string = SYSTEM_MESSAGES.INTERNAL_SERVER_ERROR
    let error_code: string | undefined
    let details: any
    let is_operational = false

    // Handle CustomException
    if (exception instanceof CustomException) {
      const exception_response = exception.getResponse()
      status_code = (exception_response as IError).status_code
      message = (exception_response as IError).message
      error_code = (exception_response as IError).code
      details =
        (exception_response as IError).validation ||
        (exception_response as IError).details
      is_operational = true
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      status_code = exception.getStatus()
      const response = exception.getResponse()
      message =
        typeof response === "string"
          ? response
          : (response as any).message || message
      is_operational = status_code < 500
    }
    // Handle Axios errors from external services
    else if (isAxiosError(exception)) {
      if (exception.response?.data) {
        // Service returned an error response
        const axios_data = exception.response.data as IError
        status_code =
          axios_data.status_code || exception.response.status || status_code
        message = axios_data.message || message
        error_code = axios_data.code
        details = axios_data.validation || axios_data.details
        is_operational = true
      } else if (
        exception.code === "ECONNREFUSED" ||
        exception.code === "ETIMEDOUT"
      ) {
        // Network/connection errors
        status_code = HttpStatus.SERVICE_UNAVAILABLE
        message = SYSTEM_MESSAGES.SERVICE_UNAVAILABLE
        error_code = ERROR_CODES.SERVICE_UNAVAILABLE
        details = `Service connection failed: ${exception.message}`
        is_operational = true
      } else {
        // Other axios errors (e.g., request setup errors)
        status_code = HttpStatus.BAD_GATEWAY
        message = SYSTEM_MESSAGES.BAD_GATEWAY
        error_code = ERROR_CODES.SERVICE_UNAVAILABLE
        details = exception.message
        is_operational = true
      }
    }

    const stack: string | undefined =
      exception instanceof Error ? exception.stack : undefined

    // Structured error logging with context
    const error_context = {
      message,
      status_code,
      is_operational,
      error_code,
      path: request.url,
      method: request.method,
      request_id: request.id,
      user_id: (request as any).user?.id,
      exception_type: exception?.constructor?.name,
      stack,
    }

    // Log based on severity
    if (status_code >= 500) {
      logger.error(error_context, "Server Error")
    } else if (status_code >= 400) {
      logger.warn(error_context, "Client Error")
    } else {
      logger.info(error_context, "Error")
    }

    // Build error response
    const error_response: ErrorResponse = {
      success: false,
      status_code: status_code,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      request_id: request.id,
    }

    // Add error code if available
    if (error_code) {
      error_response.error_code = error_code
    }

    // Add details if available
    if (details) {
      error_response.details = details
    }

    // Include stack trace in development for non-operational errors
    if (config.is_dev && !is_operational && stack) {
      error_response.stack = stack
    }

    reply.status(status_code).send(error_response)
  }
}
