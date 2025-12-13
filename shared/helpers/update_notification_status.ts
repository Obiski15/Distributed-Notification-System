import axios, { AxiosError } from "axios"
import { config } from "../config/index.js"
import * as ERROR_CODES from "../constants/error-codes.js"
import * as STATUS_CODES from "../constants/status-codes.js"
import AppError from "../utils/AppError.js"

import circuit_breaker from "../utils/circuit_breaker.js"
import discover_service from "../utils/discover_service.js"
import logger from "../utils/logger.js"

interface NotificationOptions {
  request_id: string
  status: "delivered" | "failed"
  error?: any
}

const update_notification_status = async ({
  status,
  request_id,
  error = null,
}: NotificationOptions) => {
  const breaker = circuit_breaker(
    async () => {
      try {
        const service = await discover_service(config.GATEWAY_SERVICE)
        const url = `http://${
          service.ServiceAddress || service.Address
        }:${service.ServicePort}/api/v1/notifications/email/status`

        await axios.post<{ data: any }>(
          url,
          {
            request_id,
            status,
            timestamp: new Date().toISOString(),
            error,
          },
          {
            headers: {
              "x-internal-secret": config.INTERNAL_SERVICE_SECRET,
              "Content-Type": "application/json",
            },
          },
        )
        logger.info(`Notification status updated: ${request_id} -> ${status}`)
      } catch (error) {
        if (error instanceof AxiosError) throw error.response?.data

        throw new AppError({
          message: `Request to '${config.GATEWAY_SERVICE}' failed`,
          status_code: STATUS_CODES.INTERNAL_SERVER_ERROR,
          code: ERROR_CODES.SERVICE_UNAVAILABLE,
        })
      }
    },

    config.GATEWAY_SERVICE,
  )

  return await breaker.fire()
}

export default update_notification_status
