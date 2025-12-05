import type { FastifyReply, FastifyRequest } from "fastify"
import * as STATUS_CODES from "../constants/status-codes"
import * as SYSTEM_MESSAGES from "../constants/system-message"
import type { IError } from "../types"
import logger from "./logger"

const errorHandler = (
  error: any,
  _request: FastifyRequest,
  reply: FastifyReply,
) => {
  logger.error(`Error Handler:, ${error}`)
  const err = error as IError

  reply.status(err.status_code ?? STATUS_CODES.INTERNAL_SERVER_ERROR).send({
    success: false,
    status_code: err.status_code ?? STATUS_CODES.INTERNAL_SERVER_ERROR,
    message: err.is_operational
      ? err.message
      : SYSTEM_MESSAGES.INTERNAL_SERVER_ERROR,
    error: err.validation ?? undefined,
  })
}

export default errorHandler
