import { isAxiosError } from "axios"

import * as STATUS_CODES from "../constants/status-codes"

const breaker_filter = (err: unknown) => {
  if (isAxiosError(err)) {
    const status: number =
      err.response?.status ||
      err?.status ||
      err.response?.data?.status_code ||
      STATUS_CODES.INTERNAL_SERVER_ERROR

    // Only count 5xx errors
    if (
      status >= STATUS_CODES.BAD_REQUEST &&
      status < STATUS_CODES.INTERNAL_SERVER_ERROR
    ) {
      return true
    }
  }

  return false
}

export default breaker_filter
