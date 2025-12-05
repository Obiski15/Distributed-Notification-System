import type { ResultSetHeader, RowDataPacket } from "@fastify/mysql"
import * as ERROR_CODES from "@shared/constants/error-codes.js"
import * as STATUS_CODES from "@shared/constants/status-codes.js"
import * as SYS_MESSAGES from "@shared/constants/system-message.js"
import AppError from "@shared/utils/AppError.js"
import bcrypt from "bcrypt"
// import { v4 as uuid } from "uuid"

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

export type UserWithoutPassword = Omit<User, "password">

export class AuthModel extends BaseModel {
  salt_rounds = 10

  constructor(fastify: FastifyInstance) {
    super(fastify)
  }

  register = async (data: Register) => {
    if (!data.password || data.password.length < 6)
      throw new AppError({
        message: SYS_MESSAGES.INVALID_PASSWORD_FORMAT,
        status_code: STATUS_CODES.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_ERROR,
      })

    const existing_user = await this.find_by_email(data.email)

    if (existing_user)
      throw new AppError({
        message: SYS_MESSAGES.USER_ALREADY_EXISTS,
        status_code: STATUS_CODES.CONFLICT,
        code: ERROR_CODES.USER_ALREADY_EXISTS,
      })

    const hashed_password = await this.hash_password(data.password)

    await this.fastify.mysql.query<ResultSetHeader>(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [data.email, hashed_password, data.name],
    )

    const user = await this.find_by_email(data.email)

    const tokens = this.generate_tokens(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        ...(user.created_at && { created_at: user.created_at }),
        ...(user.updated_at && { updated_at: user.updated_at }),
      },
      tokens,
    }
  }

  login = async (data: Login) => {
    // Find user by email
    const user = await this.find_by_email(data.email)

    if (!user)
      throw new AppError({
        message: SYS_MESSAGES.USER_NOT_FOUND,
        status_code: STATUS_CODES.NOT_FOUND,
        code: ERROR_CODES.USER_NOT_FOUND,
      })

    // Compare password
    const is_password_valid = await this.compare_password(
      data.password,
      user.password,
    )
    if (!is_password_valid)
      throw new AppError({
        message: SYS_MESSAGES.INVALID_CREDENTIALS,
        status_code: STATUS_CODES.BAD_REQUEST,
        code: ERROR_CODES.INVALID_CREDENTIALS,
      })

    // Remove password from user object
    const user_without_password: UserWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      ...(user.created_at && { created_at: user.created_at }),
      ...(user.updated_at && { updated_at: user.updated_at }),
    }

    // Generate tokens
    const tokens = this.generate_tokens(user_without_password)

    return {
      user: {
        id: user_without_password.id,
        email: user_without_password.email,
        name: user_without_password.name,
        ...(user_without_password.created_at && {
          created_at: user_without_password.created_at,
        }),
        ...(user_without_password.updated_at && {
          updated_at: user_without_password.updated_at,
        }),
      },
      tokens,
    }
  }

  async hash_password(password: string): Promise<string> {
    return bcrypt.hash(password, this.salt_rounds)
  }

  async compare_password(
    password: string,
    hashed_password: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashed_password)
  }

  generate_refresh_token(user: UserWithoutPassword): string {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    }
    return this.fastify.jwt.refresh.sign(payload)
  }

  generate_access_token(user: UserWithoutPassword): string {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    }

    return this.fastify.jwt.access.sign(payload)
  }

  generate_tokens(user: UserWithoutPassword) {
    return {
      access_token: this.generate_access_token(user),
      refresh_token: this.generate_refresh_token(user),
    }
  }
}
