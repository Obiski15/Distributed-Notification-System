export const notificationSchema = {
  body: {
    type: "object",
    required: ["userId", "subject", "message"],
    properties: {
      userId: { type: "string" },
      subject: { type: "string" },
      message: { type: "string" },
    },
  },
};

export const envSchema = {
  type: "object",
  required: ["PORT", "NODE_ENV", "RABBITMQ_CONNECTION_URL"],
  properties: {
    PORT: { type: "number", default: 3000 },
    NODE_ENV: { type: "string", default: "development" },
    RABBITMQ_CONNECTION_URL: { type: "string" },
  },
};
