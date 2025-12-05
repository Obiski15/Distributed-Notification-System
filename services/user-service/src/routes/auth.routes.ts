import * as STATUS_CODES from "@shared/constants/status-codes.js"
import * as SYSTEM_MESSAGES from "@shared/constants/system-message.js"
import type { FastifyInstance } from "fastify"

import { AuthModel } from "../models/auth.model.js"
import { login_schema, register_schema } from "../schemas/auth.schema.js"

// eslint-disable-next-line
const auth_routes = async (fastify: FastifyInstance) => {
  const auth_model = new AuthModel(fastify)

  fastify.post<{ Body: Register }>(
    "/register",
    {
      schema: register_schema,
    },
    async (request, reply) => {
      const data = await auth_model.register(request.body)

      return reply.status(STATUS_CODES.CREATED).send({
        success: true,
        message: SYSTEM_MESSAGES.USER_CREATED,
        data,
      })
    },
  )

  fastify.post<{ Body: Login }>(
    "/login",
    {
      schema: login_schema,
    },
    async (request, reply) => {
      const data = await auth_model.login(request.body)

      return reply.status(STATUS_CODES.OK).send({
        success: true,
        message: SYSTEM_MESSAGES.LOGIN_SUCCESSFUL,
        data,
      })
    },
  )
}

export default auth_routes
