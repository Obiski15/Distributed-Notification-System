import "fastify"

declare module "fastify" {
  interface FastifyInstance {
    mysql: Pool
  }
}
