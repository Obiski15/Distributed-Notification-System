import { config } from "@shared/config/index.js"
import * as STATUS_CODES from "@shared/constants/status-codes.js"
import AppError from "@shared/utils/AppError.js"
import axios, { AxiosError } from "axios"

import circuit_breaker from "@shared/utils/circuit_breaker.js"
import discover_service from "../utils/discover_service.js"

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
      } catch (error) {
        if (error instanceof AxiosError) throw error.response?.data

        throw new AppError(
          `Request to '${config.GATEWAY_SERVICE}' failed`,
          STATUS_CODES.INTERNAL_SERVER_ERROR,
        )
      }
    },

    config.GATEWAY_SERVICE,
  )

  return await breaker.fire()
}

export default update_notification_status
