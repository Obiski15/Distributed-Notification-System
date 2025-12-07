import { seconds, ThrottlerOptions } from "@nestjs/throttler"

export const DEFAULT_LIMIT: ThrottlerOptions = {
  ttl: seconds(60),
  limit: 100,
}

export const AUTH_LIMIT: ThrottlerOptions = {
  ttl: seconds(60),
  limit: 5,
}

export const SENSITIVE_LIMIT: ThrottlerOptions = {
  ttl: seconds(60),
  limit: 10,
}

export const PUBLIC_LIMIT: ThrottlerOptions = {
  ttl: seconds(60),
  limit: 200,
}
