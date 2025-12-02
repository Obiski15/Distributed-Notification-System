import { FastifyInstance, FastifyRequest } from "fastify"

import * as STATUS_CODES from "@shared/constants/status-codes.js"
import * as SYSTEM_MESSAGES from "@shared/constants/system-message.js"
import AppError from "@shared/utils/AppError.js"

import { UserModel } from "../models/user.model.js"
import {
  push_token_schema,
  update_preferences_schema,
  update_user_schema,
  user_schema,
} from "../schemas/user.schema.js"

const user_id = (request: FastifyRequest) => {
  return request.headers["x-user-id"] as string
}

const user_route = (fastify: FastifyInstance) => {
  const user_model = new UserModel(fastify)

  fastify.addHook("preHandler", (request, _reply, done) => {
    const id = request.headers["x-user-id"]
    if (!id)
      throw new AppError(
        SYSTEM_MESSAGES.MISSING_USERID_HEADER,
        STATUS_CODES.BAD_REQUEST,
      )

    done()
  })

  fastify.get(
    "/",
    {
      schema: user_schema,
    },
    async (request, reply) => {
      const id = user_id(request)

      const user = await user_model.find_by_id(id)

      reply.code(STATUS_CODES.OK).send({
        message: SYSTEM_MESSAGES.USER_RETRIEVED,
        success: true,
        data: { ...user },
      })
    },
  )

  fastify.patch<{ Body: UpdateUser }>(
    "/",
    {
      schema: update_user_schema,
    },
    async (request, reply) => {
      const id = user_id(request)

      await user_model.update_user(request.body, id)

      reply.code(STATUS_CODES.OK).send({
        success: true,
        message: SYSTEM_MESSAGES.USER_UPDATED,
        data: request.body,
      })
    },
  )

  fastify.post<{ Body: UpdatePreferences }>(
    "/preferences",
    {
      schema: update_preferences_schema,
    },
    async (request, reply) => {
      const id = user_id(request)

      await user_model.update_preferences(request.body, id)

      reply.code(STATUS_CODES.OK).send({
        success: true,
        message: SYSTEM_MESSAGES.NOTIFICATION_PREFERENCE_UPDATED,
        data: { ...request.body },
      })
    },
  )

  fastify.post<{ Body: PushToken }>(
    "/push-tokens",
    {
      schema: push_token_schema,
    },
    async (request, reply) => {
      const id = user_id(request)

      const message = await user_model.push_tokens(request.body.token, id)

      reply.code(STATUS_CODES.OK).send({
        success: true,
        message,
      })
    },
  )
}

export default user_route
