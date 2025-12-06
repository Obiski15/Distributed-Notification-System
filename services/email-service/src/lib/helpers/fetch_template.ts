import { config } from "@dns/shared/config/index.js"
import * as ERROR_CODES from "@dns/shared/constants/error-codes.js"
import * as STATUS_CODES from "@dns/shared/constants/status-codes.js"
import AppError from "@dns/shared/utils/AppError.js"
import circuit_breaker from "@dns/shared/utils/circuit_breaker.js"
import axios, { AxiosError } from "axios"

import discover_service from "@dns/shared/utils/discover_service.js"
interface Template {
  body: string
  subject: string
}

export const fetch_template = (template_code: string) => {
  const template = circuit_breaker<Template>(async () => {
    try {
      const service = await discover_service(config.TEMPLATE_SERVICE)

      const url = `http://${
        service.ServiceAddress || service.Address
      }:${service.ServicePort}/api/v1/templates/${template_code}`

      const res = await axios.get<{ data: Template }>(url)

      return res.data.data
    } catch (error) {
      if (error instanceof AxiosError) throw error.response?.data

      throw new AppError({
        message: `Request to '${config.TEMPLATE_SERVICE}' failed`,
        status_code: STATUS_CODES.INTERNAL_SERVER_ERROR,
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
      })
    }
  }, config.TEMPLATE_SERVICE).fire()

  return template
}
