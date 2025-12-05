import { RowDataPacket } from "@fastify/mysql"
import * as ERROR_CODES from "@shared/constants/error-codes.js"
import * as STATUS_CODES from "@shared/constants/status-codes.js"
import * as SYS_MESSAGES from "@shared/constants/system-message.js"

import { FastifyInstance } from "fastify"

import AppError from "@shared/utils/AppError.js"

interface User extends RowDataPacket {
  id: string
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

type UserWithoutPassword = Omit<User, "password" | "id">

export class BaseModel {
  constructor(protected fastify: FastifyInstance) {
    this.fastify = fastify
  }

  find_by_id = async (id: string): Promise<UserWithoutPassword> => {
    const [[user]] = await this.fastify.mysql.query<User[]>(
      "SELECT id, email, name, preferences, push_tokens, created_at, updated_at FROM users WHERE id = ?",
      [id],
    )

    if (!user)
      throw new AppError({
        message: SYS_MESSAGES.USER_NOT_FOUND,
        status_code: STATUS_CODES.NOT_FOUND,
        code: ERROR_CODES.USER_NOT_FOUND,
      })

    return user as UserWithoutPassword
  }

  find_by_email = async (email: string): Promise<User> => {
    const [[user]] = await this.fastify.mysql.query<User[]>(
      "SELECT * FROM users WHERE email = ?",
      [email],
    )
    return user as User
  }
}
