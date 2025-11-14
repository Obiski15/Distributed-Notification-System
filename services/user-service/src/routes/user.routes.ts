import type { FastifyInstance } from "fastify"
import { authUser, AuthUtils } from "../lib/utils/auth.js"

const user_route = async (fastify: FastifyInstance) => {
  const authUtils = new AuthUtils()

  // Example of how to use the authUser middleware
  // This route is protected and requires a valid JWT token
  fastify.get(
    "/protected-example",
    {
      preHandler: [authUser(authUtils)],
    },
    async (request, reply) => {
      return reply.send({
        success: true,
        message: "You have accessed a protected route!",
        user: request.user,
      })
    },
  )
}

export default user_route
