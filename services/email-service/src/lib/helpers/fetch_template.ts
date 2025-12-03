import { config } from "@shared/config/index.js"
import * as STATUS_CODES from "@shared/constants/status-codes.js"
import AppError from "@shared/utils/AppError.js"
import circuit_breaker from "@shared/utils/circuit_breaker.js"
import axios, { AxiosError } from "axios"

import discover_service from "../utils/discover_service.js"
interface Template {
  body: string
  subject: string
}

export const fetch_template = async (template_code: string) => {
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

      throw new AppError(
        `Request to '${config.TEMPLATE_SERVICE}' failed`,
        STATUS_CODES.INTERNAL_SERVER_ERROR,
      )
    }
  }, config.TEMPLATE_SERVICE).fire()

  return template
}
