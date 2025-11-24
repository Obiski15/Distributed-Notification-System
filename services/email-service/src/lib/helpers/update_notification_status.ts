import circuit_breaker from "../utils/circuit_breaker.js"
import fetch_service from "../utils/fetch_service.js"

interface NotificationOptions {
  notification_id: string
  status: "delivered" | "failed"
  error?: any
}

const update_notification_status = async ({
  status,
  notification_id,
  error,
}: NotificationOptions) => {
  circuit_breaker(
    async () =>
      await fetch_service(
        "gateway-service",
        "api/v1/notifications/email/status",
        {
          method: "POST",
          body: JSON.stringify({
            notification_id,
            status,
            timestamp: new Date().toISOString(),
            error,
          }),
          headers: {
            "Content-Type": "application/json",
          },
        },
      ),
    "Gateway",
  )
}

export default update_notification_status
