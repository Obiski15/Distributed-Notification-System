import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
} from "@nestjs/common"
import { AxiosError } from "axios"
import { FastifyReply } from "fastify"
import { CustomException } from "../custom/custom-exceptions"

@Catch()
export class GlobalFilter implements ExceptionFilter {
  constructor(private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp()
    const reply = ctx.getResponse<FastifyReply>()

    const stack: string | undefined =
      exception instanceof Error ? exception.stack : undefined
    let status_code: number = HttpStatus.INTERNAL_SERVER_ERROR
    let message: string = "Something went wrong"
    const status = false

    if (exception instanceof CustomException) {
      const exceptionResponse = exception.getResponse()
      status_code = (exceptionResponse as IError).status_code
      message = (exceptionResponse as IError).message
    }

    if (exception instanceof AxiosError && exception.response?.data) {
      message = (exception.response?.data as IError).message
      status_code = (exception.response?.data as IError).status_code
    }

    const errorResponse = {
      status,
      message,
      status_code,
      stack,
    }

    this.logger.error(errorResponse)

    reply.status(status_code).send(errorResponse)
  }
}
