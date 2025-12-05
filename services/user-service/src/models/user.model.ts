import type { RowDataPacket } from "@fastify/mysql"
import * as ERROR_CODES from "@shared/constants/error-codes.js"
import * as STATUS_CODES from "@shared/constants/status-codes.js"
import * as SYSTEM_MESSAGES from "@shared/constants/system-message.js"
import AppError from "@shared/utils/AppError.js"
import { type FastifyInstance } from "fastify"

import { BaseModel } from "./base.model.js"

export interface User extends RowDataPacket {
  id: number
  email: string
  password: string
  name: string
  preferences?: {
    push_notification_enabled: boolean
    email_notification_enabled: boolean
  }
  push_tokens?: string[]
  created_at?: string
  updated_at?: string
}

export type UserWithoutPassword = Omit<User, "password" | "id">

export class UserModel extends BaseModel {
  constructor(fastify: FastifyInstance) {
    super(fastify)
  }

  update_user = async (data: UpdateUser, id: string) => {
    const set_clauses: string[] = []
    const values: any[] = []

    if (data.email) {
      const existing_user = await this.find_by_email(data.email)

      if (existing_user.id !== id)
        throw new AppError({
          message: SYSTEM_MESSAGES.USER_ALREADY_EXISTS,
          status_code: STATUS_CODES.CONFLICT,
          code: ERROR_CODES.USER_ALREADY_EXISTS,
        })
    }

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        set_clauses.push(`${key} = ?`)
        values.push(value)
      }
    })

    if (set_clauses.length === 0) {
      throw new AppError({
        message: SYSTEM_MESSAGES.NO_VALID_UPDATE_FIELDS,
        status_code: STATUS_CODES.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_ERROR,
      })
    }

    await this.find_by_id(id)

    await this.fastify.mysql.query(
      `UPDATE users SET ${set_clauses.join(", ")} WHERE id = ?`,
      [...values, id],
    )

    await this.fastify.mysql.query("SELECT * FROM users WHERE id = ?", [id])
  }

  update_preferences = async (data: UpdatePreferences, id: string) => {
    const user = await this.find_by_id(id)

    const updated_preferences = { ...user.preferences, ...data.preferences }

    await this.fastify.mysql.query(
      "UPDATE users SET preferences = ? WHERE id = ?",
      [JSON.stringify(updated_preferences), id],
    )
  }

  push_tokens = async (token: string, id: string) => {
    const user = await this.find_by_id(id)

    const current_tokens = user?.push_tokens || []

    if (current_tokens.includes(token))
      return SYSTEM_MESSAGES.PUSH_TOKEN_ALREADY_EXISTS

    const updated_tokens = [...current_tokens, token]

    await this.fastify.mysql.query(
      "UPDATE users SET push_tokens = ? WHERE id = ?",
      [JSON.stringify(updated_tokens), id],
    )

    return SYSTEM_MESSAGES.PUSH_TOKEN_UPDATED
  }
}
