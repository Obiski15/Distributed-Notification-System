import env from "@fastify/env";
import proxy from "@fastify/http-proxy";
import Fastify from "fastify";

import { envSchema, notificationSchema } from "./schema.js";

interface NotificationBody {
  userId: string;
  subject: string;
  message: string;
}

const app = Fastify({ logger: true });

app.register(env, {
  confKey: "config",
  schema: envSchema,
  dotenv: true,
});

// Register proxy routes for each service
app.register(proxy, {
  upstream: "http://localhost:3001",
  prefix: "/api/users",
  rewritePrefix: "/users",
  http2: false,
});

app.post<{ Body: NotificationBody }>(
  "/api/notifications/send",
  { schema: notificationSchema },
  async (request, reply) => {
    const { userId, subject, message } = request.body;

    console.log(userId, subject, message);

    reply.send({ message: "Hello, World!" });
  }
);

export default app;
