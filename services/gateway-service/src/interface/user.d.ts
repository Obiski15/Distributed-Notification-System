interface IUserPayload {
  sub: string
  email: string
  role: string
}

interface IUser {
  id: string
  email: string
  role: string
  preferences: {
    email_notification_enabled: boolean
    push_notification_enabled: boolean
  }
  push_tokens?: string[]
}
