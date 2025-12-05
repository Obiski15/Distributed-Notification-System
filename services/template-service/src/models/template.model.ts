import type { ResultSetHeader, RowDataPacket } from "@fastify/mysql"
import * as ERROR_CODES from "@shared/constants/error-codes.js"
import * as STATUS_CODES from "@shared/constants/status-codes.js"
import AppError from "@shared/utils/AppError.js"
import { type FastifyInstance } from "fastify"

export interface Template extends RowDataPacket {
  id: number
  name: string
  subject: string | null
  body: string | null
}

export interface CreateTemplateBody {
  name: string
  subject: string
  body: string
}

export const find_all_templates = async (fastify: FastifyInstance) => {
  const [templates] = await fastify.mysql.query<Template[]>(
    "SELECT * FROM templates",
  )
  return templates as Template[]
}

export const create_template = async (
  fastify: FastifyInstance,
  body: CreateTemplateBody,
): Promise<Template> => {
  if (!body.name || !body.subject || !body.body) {
    throw new AppError({
      message: "Missing required fields",
      status_code: STATUS_CODES.BAD_REQUEST,
      code: ERROR_CODES.MISSING_REQUIRED_FIELD,
    })
  }

  const [result] = await fastify.mysql.query<ResultSetHeader>(
    "INSERT INTO templates (name, subject, body) VALUES (?, ?, ?)",
    [body.name, body.subject, body.body],
  )

  return {
    id: result.insertId,
    name: body.name,
    subject: body.subject,
    body: body.body,
  } as Template
}

export const find_template = async (
  fastify: FastifyInstance,
  template_code: string,
): Promise<Template> => {
  const [[template]] = await fastify.mysql.query<Template[]>(
    "SELECT * FROM templates WHERE name = ?",
    [template_code],
  )

  if (!template)
    throw new AppError({
      message: "Template not found",
      status_code: STATUS_CODES.NOT_FOUND,
      code: ERROR_CODES.TEMPLATE_NOT_FOUND,
    })

  return template as Template
}

export const update_template = async (
  fastify: FastifyInstance,
  template_code: string,
  fields: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  if (!fields || !Object.keys(fields).length)
    throw new AppError({
      message: "No fields provided for update",
      status_code: STATUS_CODES.BAD_REQUEST,
      code: ERROR_CODES.INVALID_INPUT,
    })

  const setClauses: string[] = []
  const values: unknown[] = []

  for (const [key, value] of Object.entries(fields)) {
    setClauses.push(`${key} = ?`)
    values.push(value)
  }

  const sql = `UPDATE templates SET ${setClauses.join(", ")} WHERE name = ?`
  values.push(template_code)

  const [result] = await fastify.mysql.query<ResultSetHeader>(sql, values)

  if (result.affectedRows === 0)
    throw new AppError({
      message: "Template not found",
      status_code: STATUS_CODES.NOT_FOUND,
      code: ERROR_CODES.TEMPLATE_NOT_FOUND,
    })

  return fields
}

export const delete_template = async (
  fastify: FastifyInstance,
  template_code: string,
): Promise<void> => {
  const [[template]] = await fastify.mysql.query<Template[]>(
    "SELECT id FROM templates WHERE name = ?",
    [template_code],
  )

  if (!template) {
    throw new AppError({
      message: "Template not found",
      status_code: STATUS_CODES.NOT_FOUND,
      code: ERROR_CODES.TEMPLATE_NOT_FOUND,
    })
  }

  await fastify.mysql.query("DELETE FROM templates WHERE name = ?", [
    template_code,
  ])
}
