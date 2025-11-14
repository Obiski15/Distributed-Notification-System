import discover_service from "./discover_service.js"

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
  const data = await discover_service(
    "gateway-service",
    `api/v1/notifications/email/status`,
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
  )

  return data.data
}

export default update_notification_status
