import "./load-env"

const isDev = process.env.NODE_ENV === "development"
const isProd = process.env.NODE_ENV === "production"

export const config = {
  // ENVIRONMENT
  isDev,
  isProd,

  // SERVICES
  TEMPLATE_SERVICE: "template-service",
  GATEWAY_SERVICE: "gateway-service",
  EMAIL_SERVICE: "email-service",
  USER_SERVICE: "user-service",
  PUSH_SERVICE: "push-service",

  // PORTS
  TEMPLATE_SERVICE_PORT: +process.env.TEMPLATE_SERVICE_PORT!,
  GATEWAY_SERVICE_PORT: +process.env.GATEWAY_SERVICE_PORT!,
  EMAIL_SERVICE_PORT: +process.env.EMAIL_SERVICE_PORT!,
  USER_SERVICE_PORT: +process.env.USER_SERVICE_PORT!,
  PUSH_SERVICE_PORT: +process.env.PUSH_SERVICE_PORT!,
  HOST: "0.0.0.0",

  // DB
  TEMPLATE_SERVICE_DB: process.env.TEMPLATE_SERVICE_DB,
  USER_SERVICE_DB: process.env.USER_SERVICE_DB,

  // REDIS
  REDIS_HOST: process.env.REDIS_HOST!,
  REDIS_PORT: +process.env.REDIS_PORT!,

  // CONSUL
  CONSUL_HOST: process.env.CONSUL_HOST!,
  CONSUL_PORT: +process.env.CONSUL_PORT!,

  // JWT
  INTERNAL_SERVICE_SECRET: process.env.INTERNAL_SERVICE_SECRET!,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET!,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET!,
  JWT_ACCESS_SECRET_EXPIRES_IN: process.env.JWT_ACCESS_SECRET_EXPIRES_IN!,
  JWT_REFRESH_SECRET_EXPIRES_IN: process.env.JWT_REFRESH_SECRET_EXPIRES_IN!,

  // RABBITMQ
  RABBITMQ_CONNECTION_URL: process.env.RABBITMQ_CONNECTION_URL!,
  NOTIFICATION_EXCHANGE: "notifications.direct",
  NOTIFICATION_RETRY_DELAY: 20000, // 20 SECS
  NOTIFICATION_MAX_RETRIES: 3,
  EMAIL_ROUTING_KEY: "email",
  PUSH_ROUTING_KEY: "push",

  // FIREBASE
  FCM_PROJECT_ID: process.env.FCM_PROJECT_ID!,
  FCM_CLIENT_EMAIL: process.env.FCM_CLIENT_EMAIL!,
  FCM_PRIVATE_KEY: process.env.FCM_PRIVATE_KEY!,
  FCM_PRIVATE_KEY_ID: process.env.FCM_PRIVATE_KEY_ID!,

  // SMTP
  SMTP_FROM: "<hng.notification@gmail.com>",
  SMTP_USER: process.env.SMTP_USER!,
  SMTP_PASS: process.env.SMTP_PASS!,
  SMTP_PORT: process.env.SMTP_PORT!,
  SMTP_HOST: process.env.SMTP_HOST!,

  // BREAKER OPTIONS
  BREAKER_OPTIONS: isDev
    ? {
        timeout: 30000,
        resetTimeout: 1000,
        errorThresholdPercentage: 50,
        volumeThreshold: 1,
      }
    : {
        timeout: 3000,
        resetTimeout: 30000,
        errorThresholdPercentage: 20,
        volumeThreshold: 10,
      },
}
