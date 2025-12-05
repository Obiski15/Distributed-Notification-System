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
    const setClauses: string[] = []
    const values: any[] = []

    if (data.email) {
      const existingUser = await this.find_by_email(data.email)

      if (existingUser.id !== id)
        throw new AppError({
          message: SYSTEM_MESSAGES.USER_ALREADY_EXISTS,
          status_code: STATUS_CODES.CONFLICT,
          code: ERROR_CODES.USER_ALREADY_EXISTS,
        })
    }

    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined) {
        setClauses.push(`${key} = ?`)
        values.push(value)
      }
    })

    if (setClauses.length === 0) {
      throw new AppError({
        message: SYSTEM_MESSAGES.NO_VALID_UPDATE_FIELDS,
        status_code: STATUS_CODES.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_ERROR,
      })
    }

    await this.find_by_id(id)

    await this.fastify.mysql.query(
      `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`,
      [...values, id],
    )

    await this.fastify.mysql.query("SELECT * FROM users WHERE id = ?", [id])
  }

  update_preferences = async (data: UpdatePreferences, id: string) => {
    const user = await this.find_by_id(id)

    const updatedPreferences = { ...user.preferences, ...data.preferences }

    await this.fastify.mysql.query(
      "UPDATE users SET preferences = ? WHERE id = ?",
      [JSON.stringify(updatedPreferences), id],
    )
  }

  push_tokens = async (token: string, id: string) => {
    const user = await this.find_by_id(id)

    const currentTokens = user?.push_tokens || []

    if (currentTokens.includes(token))
      return SYSTEM_MESSAGES.PUSH_TOKEN_ALREADY_EXISTS

    const updatedTokens = [...currentTokens, token]

    await this.fastify.mysql.query(
      "UPDATE users SET push_tokens = ? WHERE id = ?",
      [JSON.stringify(updatedTokens), id],
    )

    return SYSTEM_MESSAGES.PUSH_TOKEN_UPDATED
  }
}
