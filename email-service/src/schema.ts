export const envSchema = {
  type: "object",
  required: [
    "PORT",
    "MAILTRAP_USER",
    "MAILTRAP_PASS",
    "NODE_ENV",
    "RABBITMQ_CONNECTION_URL",
  ],
  properties: {
    PORT: { type: "number", default: 3001 },
    MAILTRAP_USER: { type: "string" },
    MAILTRAP_PASS: { type: "string" },
    DB_URL: { type: "string" },
    NODE_ENV: { type: "string", default: "development" },
  },
};
