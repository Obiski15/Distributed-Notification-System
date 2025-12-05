interface AppErrorOptions {
  message: string
  status_code: number
  code?: string
  details?: any
  validation?: any
  is_operational?: boolean
}

class AppError extends Error {
  status_code: number
  is_operational: boolean
  code?: string
  details?: any
  validation?: any

  constructor(options: AppErrorOptions) {
    const {
      message,
      status_code,
      code,
      details,
      validation,
      is_operational = true,
    } = options

    super(message)
    this.status_code = status_code
    this.is_operational = is_operational

    if (code) this.code = code
    if (details) this.details = details
    if (validation) this.validation = validation

    Error.captureStackTrace(this, this.constructor)
  }
}

export default AppError
