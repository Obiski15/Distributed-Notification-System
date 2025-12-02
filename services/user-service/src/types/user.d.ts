interface UpdateUser {
  name?: string
  email?: string
}

interface UpdatePreferences {
  preferences: {
    push_notification_enabled?: boolean
    email_notification_enabled?: boolean
  }
}

interface PushToken {
  token: string
}
