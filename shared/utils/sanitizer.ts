export const sensitive_fields = [
  "password",
  "token",
  "authorization",
  "cookie",
  "access_token",
  "refresh_token",
  "api_key",
  "secret",
  "apikey",
  "x-api-key",
  "auth",
]

export function sanitize_object(
  obj: Record<string, unknown> | null | undefined,
): Record<string, unknown> | null {
  if (!obj || typeof obj !== "object") return null

  const sanitized: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(obj)) {
    const lower_key = key.toLowerCase()

    // Check if key contains sensitive field
    const is_sensitive = sensitive_fields.some(field =>
      lower_key.includes(field),
    )

    if (is_sensitive) {
      sanitized[key] = "***REDACTED***"
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      sanitized[key] = sanitize_object(value as Record<string, unknown>)
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item: unknown) => {
        if (typeof item === "object" && item !== null) {
          return sanitize_object(item as Record<string, unknown>)
        }
        return item
      })
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}
