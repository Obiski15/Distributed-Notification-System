export const PushNotificationSchema = {
  type: "object",
  required: ["token", "title", "body"],
  properties: {
    token: {
      type: "string",
      description: "FCM device token",
    },
    title: {
      type: "string",
      description: "Notification title",
    },
    body: {
      type: "string",
      description: "Notification body text",
    },
    image: {
      type: "string",
      description: "Optional image URL for the notification",
    },
    link: {
      type: "string",
      description: "Optional deep link to open when notification is clicked",
    },
    data: {
      type: "object",
      description: "Optional custom data payload",
      additionalProperties: {
        type: "string",
      },
    },
    priority: {
      type: "string",
      enum: ["high", "normal"],
      description: "Notification priority",
    },
    ttl: {
      type: "number",
      description: "Time to live in seconds",
    },
  },
}

export const TokenValidationSchema = {
  type: "object",
  required: ["token"],
  properties: {
    token: {
      type: "string",
      description: "FCM device token to validate",
    },
  },
}

export const PushNotificationResponseSchema = {
  type: "object",
  properties: {
    success: {
      type: "boolean",
      description: "Whether the operation was successful",
    },
    messageId: {
      type: "string",
      description: "FCM message ID if successful",
    },
    error: {
      type: "string",
      description: "Error message if failed",
    },
  },
}

export const TokenValidationResponseSchema = {
  type: "object",
  properties: {
    valid: {
      type: "boolean",
      description: "Whether the token is valid",
    },
  },
}

export const ErrorResponseSchema = {
  type: "object",
  properties: {
    error: {
      type: "string",
      description: "Error message",
    },
    statusCode: {
      type: "number",
      description: "HTTP status code",
    },
  },
}

export const HealthResponseSchema = {
  type: "object",
  properties: {
    status: {
      type: "string",
      description: "Service health status",
    },
    timestamp: {
      type: "string",
      format: "date-time",
      description: "Current timestamp",
    },
    uptime: {
      type: "number",
      description: "Service uptime in seconds",
    },
  },
}
