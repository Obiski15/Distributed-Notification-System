import type { IError } from "@dns/shared/types"
import { HttpException } from "@nestjs/common"

interface CustomExceptionOptions {
  message: string
  status_code: number
  code?: string
  details?: any
  validation?: any
  is_operational?: boolean
}

export class CustomException extends HttpException {
  constructor(options: CustomExceptionOptions) {
    const {
      message,
      status_code,
      code,
      details,
      validation,
      is_operational = true,
    } = options

    const response: Partial<IError> = {
      status: false,
      message,
      status_code,
      is_operational,
    }

    if (code) response.code = code
    if (details) response.details = details
    if (validation) response.validation = validation

    super(response, status_code)
  }
}
