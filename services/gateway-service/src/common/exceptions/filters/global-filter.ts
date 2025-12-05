import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common"
import * as ERROR_CODES from "@shared/constants/error-codes"
import * as SYSTEM_MESSAGES from "@shared/constants/system-message"
import type { IError } from "@shared/types"
import { AxiosError } from "axios"
import { FastifyReply, FastifyRequest } from "fastify"
import { CustomException } from "../custom/custom-exceptions"

import { config } from "@shared/config/index"
import logger from "@shared/utils/logger"

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

    let statusCode: number = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string = SYSTEM_MESSAGES.INTERNAL_SERVER_ERROR
    let errorCode: string | undefined
    let details: any
    let isOperational = false

    // Handle CustomException
    if (exception instanceof CustomException) {
      const exceptionResponse = exception.getResponse()
      statusCode = (exceptionResponse as IError).status_code
      message = (exceptionResponse as IError).message
      errorCode = (exceptionResponse as IError).code
      details =
        (exceptionResponse as IError).validation ||
        (exceptionResponse as IError).details
      isOperational = true
    }
    // Handle NestJS HttpException
    else if (exception instanceof HttpException) {
      statusCode = exception.getStatus()
      const response = exception.getResponse()
      message =
        typeof response === "string"
          ? response
          : (response as any).message || message
      isOperational = statusCode < 500
    }
    // Handle Axios errors from external services
    else if (exception instanceof AxiosError) {
      if (exception.response?.data) {
        // Service returned an error response
        const axiosData = exception.response.data as IError
        statusCode =
          axiosData.status_code || exception.response.status || statusCode
        message = axiosData.message || message
        errorCode = axiosData.code
        details = axiosData.validation || axiosData.details
        isOperational = true
      } else if (
        exception.code === "ECONNREFUSED" ||
        exception.code === "ETIMEDOUT"
      ) {
        // Network/connection errors
        statusCode = HttpStatus.SERVICE_UNAVAILABLE
        message = SYSTEM_MESSAGES.SERVICE_UNAVAILABLE
        errorCode = "SERVICE_UNAVAILABLE"
        details = `Service connection failed: ${exception.message}`
        isOperational = true
      } else {
        // Other axios errors (e.g., request setup errors)
        statusCode = HttpStatus.BAD_GATEWAY
        message = SYSTEM_MESSAGES.BAD_GATEWAY
        errorCode = ERROR_CODES.SERVICE_UNAVAILABLE
        details = exception.message
        isOperational = true
      }
    }

    const stack: string | undefined =
      exception instanceof Error ? exception.stack : undefined

    // Structured error logging with context
    const errorContext = {
      message,
      statusCode,
      isOperational,
      errorCode,
      path: request.url,
      method: request.method,
      requestId: request.id,
      userId: (request as any).user?.id,
      exceptionType: exception?.constructor?.name,
      stack,
    }

    // Log based on severity
    if (statusCode >= 500) {
      logger.error(errorContext, "Server Error")
    } else if (statusCode >= 400) {
      logger.warn(errorContext, "Client Error")
    } else {
      logger.info(errorContext, "Error")
    }

    // Build error response
    const errorResponse: ErrorResponse = {
      success: false,
      status_code: statusCode,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
      request_id: request.id,
    }

    // Add error code if available
    if (errorCode) {
      errorResponse.error_code = errorCode
    }

    // Add details if available
    if (details) {
      errorResponse.details = details
    }

    // Include stack trace in development for non-operational errors
    if (config.isDev && !isOperational && stack) {
      errorResponse.stack = stack
    }

    reply.status(statusCode).send(errorResponse)
  }
}
