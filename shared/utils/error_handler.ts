import type { FastifyReply, FastifyRequest } from "fastify"
import * as STATUS_CODES from "../constants/status-codes"
import * as SYSTEM_MESSAGES from "../constants/system-message"
import type { IError } from "../types/index"
import logger from "./logger"

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

const errorHandler = (
  error: any,
  request: FastifyRequest,
  reply: FastifyReply,
) => {
  const err = error as IError
  const statusCode = err.status_code ?? STATUS_CODES.INTERNAL_SERVER_ERROR
  const isOperational = err.is_operational ?? false
  const isDevelopment = process.env.NODE_ENV !== "production"

  // Structured error logging with context
  const errorContext = {
    message: err.message,
    statusCode,
    isOperational,
    path: request.url,
    method: request.method,
    requestId: request.id,
    userId: (request as any).user?.id,
    stack: err.stack,
  }

  // Log based on severity
  if (statusCode >= 500) {
    logger.error(errorContext, "Server Error")
  } else if (statusCode >= 400) {
    logger.warn(errorContext, "Client Error")
  } else {
    logger.info(errorContext, "Error")
  }

  // Determine error message
  const message = isOperational
    ? err.message
    : SYSTEM_MESSAGES.INTERNAL_SERVER_ERROR

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
  if (err.code) {
    errorResponse.error_code = err.code
  }

  // Add validation errors or details
  if (err.validation) {
    errorResponse.details = err.validation
  } else if (isOperational && err.details) {
    errorResponse.details = err.details
  }

  // Include stack trace in development for non-operational errors
  if (isDevelopment && !isOperational && err.stack) {
    errorResponse.stack = err.stack
  }

  reply.status(statusCode).send(errorResponse)
}

export default errorHandler
