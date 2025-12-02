import { config } from "@shared/config/index.js"
import admin from "firebase-admin"

// Initialize Firebase Admin SDK
let firebaseApp: admin.app.App | null = null

function initializeFirebase(): admin.app.App {
  if (!firebaseApp) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.FCM_PROJECT_ID,
        clientEmail: config.FCM_CLIENT_EMAIL,
        privateKey: config.FCM_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    })
  }
  return firebaseApp
}

interface PushNotificationPayload {
  token: string
  title: string
  body: string
  image?: string
  link?: string
  data?: Record<string, string>
  priority?: "high" | "normal"
  ttl?: number
}

interface PushNotificationResult {
  success: boolean
  messageId?: string
  error?: string
}

async function send_push_notification(payload: PushNotificationPayload) {
  try {
    const firebaseApp = initializeFirebase()
    const messaging = firebaseApp.messaging()

    const message: admin.messaging.Message = {
      token: payload.token,
      notification: {
        title: payload.title,
        body: payload.body,
        imageUrl: payload.image,
      },
      data: payload.data || {},
      android: {
        priority: payload.priority || "normal",
        ttl: Math.max(0, (payload.ttl ?? 3600) * 1000), //convert seconds to milliseconds duration format
        notification: {
          imageUrl: payload.image,
          clickAction: payload.link,
        },
      } as admin.messaging.AndroidConfig,
      apns: {
        payload: {
          aps: {
            sound: "default",
            badge: 1,
            "mutable-content": 1,
            "content-available": 1,
          },
        },
        fcmOptions: {
          imageUrl: payload.image,
        },
      },
      webpush: {
        fcmOptions: {
          link: payload.link,
        },
        headers: {
          ...(payload.image && { image: payload.image }),
        },
      },
    }
    //check if FCM token was sent
    if (!payload.token || payload.token.length < 100) {
      throw new Error("Invalid or missing FCM registration token")
    }

    await messaging.send(message)
  } catch (error) {
    let errorMessage = null
    if (error instanceof Error) {
      errorMessage = error.message
    } else if (typeof error === "string") {
      errorMessage = error
    }
    console.error("FCM send error:", errorMessage ?? error)
  }
}

async function validate_device_token(token: string): Promise<boolean> {
  try {
    const firebaseApp = initializeFirebase()
    const messaging = firebaseApp.messaging()

    // Send a test message with dry run to validate token
    await messaging.send(
      {
        token,
        notification: {
          title: "Test",
          body: "Test",
        },
      },
      true,
    )

    return true
  } catch (error) {
    console.error("Token validation error:", error)
    return false
  }
}

export { send_push_notification, validate_device_token }
export type { PushNotificationPayload, PushNotificationResult }
