import axios, { AxiosError } from "axios"
import { config } from "../config/index"
import * as ERROR_CODES from "../constants/error-codes"
import * as STATUS_CODES from "../constants/status-codes"
import AppError from "../utils/AppError"
import circuit_breaker from "../utils/circuit_breaker"
import discover_service from "../utils/discover_service"

export enum TemplateType {
  EMAIL = "EMAIL",
  PUSH = "PUSH",
}

export interface ITemplate {
  id: string
  name: string
  type: TemplateType
  subject: string
  body: string
  image_url: string | null
  action_url: string | null
  metadata: Record<string, any> | null
  version: number
  created_at: Date
  updated_at: Date
}

export const fetch_template = (template_code: string) => {
  const template = circuit_breaker<ITemplate>(async () => {
    try {
      const service = await discover_service(config.TEMPLATE_SERVICE)

      const url = `http://${
        service.ServiceAddress || service.Address
      }:${service.ServicePort}/api/v1/templates/${template_code}`

      const res = await axios.get<{ data: ITemplate }>(url)

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
