import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    config: {
      PORT: number;
      MAILTRAP_USER: string;
      MAILTRAP_PASS: string;
      RABBITMQ_CONNECTION_URL: string;
      NODE_ENV: "development" | "production";
    };
  }
}
