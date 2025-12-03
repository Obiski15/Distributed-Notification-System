import type { ResultSetHeader, RowDataPacket } from "@fastify/mysql"
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
      throw new AppError(
        SYS_MESSAGES.INVALID_PASSWORD_FORMAT,
        STATUS_CODES.BAD_REQUEST,
      )

    const existingUser = await this.find_by_email(data.email)

    if (existingUser)
      throw new AppError(
        SYS_MESSAGES.USER_ALREADY_EXISTS,
        STATUS_CODES.CONFLICT,
      )

    const hashedPassword = await this.hashPassword(data.password)

    await this.fastify.mysql.query<ResultSetHeader>(
      "INSERT INTO users (email, password, name) VALUES (?, ?, ?)",
      [data.email, hashedPassword, data.name],
    )

    const user = await this.find_by_email(data.email)

    const tokens = this.generateTokens(user)

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
      throw new AppError(SYS_MESSAGES.USER_NOT_FOUND, STATUS_CODES.NOT_FOUND)

    // Compare password
    const isPasswordValid = await this.comparePassword(
      data.password,
      user.password,
    )
    if (!isPasswordValid)
      throw new AppError(
        SYS_MESSAGES.INVALID_CREDENTIALS,
        STATUS_CODES.BAD_REQUEST,
      )

    // Remove password from user object
    const userWithoutPassword: UserWithoutPassword = {
      id: user.id,
      email: user.email,
      name: user.name,
      ...(user.created_at && { created_at: user.created_at }),
      ...(user.updated_at && { updated_at: user.updated_at }),
    }

    // Generate tokens
    const tokens = this.generateTokens(userWithoutPassword)

    return {
      user: {
        id: userWithoutPassword.id,
        email: userWithoutPassword.email,
        name: userWithoutPassword.name,
        ...(userWithoutPassword.created_at && {
          created_at: userWithoutPassword.created_at,
        }),
        ...(userWithoutPassword.updated_at && {
          updated_at: userWithoutPassword.updated_at,
        }),
      },
      tokens,
    }
  }

  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.salt_rounds)
  }

  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword)
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

  generateTokens(user: UserWithoutPassword) {
    return {
      access_token: this.generate_access_token(user),
      refresh_token: this.generate_refresh_token(user),
    }
  }
}
