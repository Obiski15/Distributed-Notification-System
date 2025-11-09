import "fastify";

declare module "fastify" {
  interface FastifyInstance {
    config: {
      PORT: number;
      RABBITMQ_CONNECTION_URL: string;
      NODE_ENV: "development" | "production";
    };
  }
}
