import { HttpException } from "@nestjs/common"

export class CustomException extends HttpException {
  constructor(message: string, status_code: number) {
    super(
      {
        success: false,
        status_code,
        message,
      },
      status_code,
    )
  }
}
