import "@fastify/jwt"
import "fastify"

export interface TokenPayload {
  sub: number | string
  email: string
  name: string
}

declare module "@fastify/jwt" {
  interface JWT {
    access: JWT
    refresh: JWT
  }
}

declare module "fastify" {
  interface FastifyInstance {
    mysql: Pool
  }

  interface FastifyRequest {
    user?: TokenPayload
  }
}
