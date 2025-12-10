import * as statusCodes from "@dns/shared/constants/status-codes.js"
import * as sysMsg from "@dns/shared/constants/system-message.js"
import { type FastifyInstance } from "fastify"

import { Template } from "../entities/template-entity.js"
import {
  create_template,
  delete_template,
  find_all_templates,
  find_template,
  update_template,
} from "../models/template.model.js"
import {
  create_template_schema,
  delete_template_schema,
  template_schema,
  templates_schema,
  update_template_schema,
} from "../schemas/template.schema.js"

const template_routes = (fastify: FastifyInstance) => {
  fastify.get(
    "/",
    {
      schema: templates_schema,
    },
    async (_request, reply) => {
      const templates = await find_all_templates()

      reply.code(statusCodes.OK).send({
        success: true,
        message: sysMsg.TEMPLATE_LIST_RETRIEVED,
        status_code: statusCodes.OK,
        data: { templates, meta: { total: templates.length } },
      })
    },
  )

  fastify.post<{
    Body: Partial<Template>
  }>(
    "/",
    {
      schema: create_template_schema,
    },
    async (request, reply) => {
      const template = await create_template(request.body)

      reply.code(statusCodes.CREATED).send({
        success: true,
        status_code: statusCodes.CREATED,
        message: sysMsg.TEMPLATE_CREATED,
        data: template,
      })
    },
  )

  fastify.get<{ Params: { template_code: string } }>(
    "/:template_code",
    {
      schema: template_schema,
    },
    async (request, reply) => {
      const template = await find_template(request.params.template_code)
      reply.code(statusCodes.OK).send({
        success: true,
        status: statusCodes.OK,
        message: sysMsg.TEMPLATE_RETRIEVED,
        data: template,
      })
    },
  )

  fastify.get<{ Params: { template_code: string; version: number } }>(
    "/:template_code/:version",
    {
      schema: template_schema,
    },
    async (request, reply) => {
      const template = await find_template(
        request.params.template_code,
        +request.params.version,
      )
      reply.code(statusCodes.OK).send({
        success: true,
        status: statusCodes.OK,
        message: sysMsg.TEMPLATE_RETRIEVED,
        data: template,
      })
    },
  )

  fastify.patch<{
    Body: Partial<Template>
    Params: { template_id: string }
  }>(
    "/:template_id",
    {
      schema: update_template_schema,
    },
    async (request, reply) => {
      const { template_id } = request.params
      const fields = request.body

      const result = await update_template(template_id, fields)

      reply.send({
        success: true,
        status: statusCodes.OK,
        message: sysMsg.TEMPLATE_UPDATED,
        data: result,
      })
    },
  )

  fastify.delete<{ Params: { template_id: string } }>(
    "/:template_id",
    {
      schema: delete_template_schema,
    },
    async (request, reply) => {
      await delete_template(request.params.template_id)

      reply.code(statusCodes.OK).send({
        success: true,
        status_code: statusCodes.OK,
        message: sysMsg.TEMPLATE_DELETED,
      })
    },
  )
}

export default template_routes
