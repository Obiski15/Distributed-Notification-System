class AppError extends Error {
  status_code: number
  is_operational: boolean = true

  constructor(message: string, status_code: number) {
    super(message)
    this.status_code = status_code

    Error.captureStackTrace(this, this.constructor)
  }
}

export default AppError
