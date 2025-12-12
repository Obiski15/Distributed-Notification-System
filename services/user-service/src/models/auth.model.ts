import * as ERROR_CODES from "@dns/shared/constants/error-codes"
import * as STATUS_CODES from "@dns/shared/constants/status-codes"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import AppError from "@dns/shared/utils/AppError"
import bcrypt from "bcrypt"

import { FastifyInstance } from "fastify"
import { UserDataSource } from "../config/datasource"
import { User as UserEntity } from "../entities/user-entity"
import { BaseModel } from "./base.model"

const userRepository = UserDataSource.getRepository(UserEntity)

export class AuthModel extends BaseModel {
  salt_rounds = 10
  fastify: FastifyInstance

  constructor(fastify: FastifyInstance) {
    super()
    this.fastify = fastify
  }

  register = async (data: Register) => {
    if (!data.password || data.password.length < 6)
      throw new AppError({
        message: SYSTEM_MESSAGES.INVALID_PASSWORD_FORMAT,
        status_code: STATUS_CODES.BAD_REQUEST,
        code: ERROR_CODES.VALIDATION_ERROR,
      })

    const user = await this.find_by_email(data.email)

    if (user)
      throw new AppError({
        message: SYSTEM_MESSAGES.USER_ALREADY_EXISTS,
        status_code: STATUS_CODES.CONFLICT,
        code: ERROR_CODES.USER_ALREADY_EXISTS,
      })

    const hashed_password = await this.hash_password(data.password)

    const new_user = userRepository.create({
      email: data.email,
      password: hashed_password,
      name: data.name,
    })

    await userRepository.save(new_user)

    const tokens = this.generate_tokens(new_user)

    return {
      user: {
        id: new_user.id,
        email: new_user.email,
        name: new_user.name,
        ...(new_user.created_at && { created_at: new_user.created_at }),
        ...(new_user.updated_at && { updated_at: new_user.updated_at }),
      },
      tokens,
    }
  }

  login = async (data: Login) => {
    // Find user by email
    const user = await userRepository
      .createQueryBuilder("user")
      .where("user.email = :email", { email: data.email })
      .addSelect("user.password")
      .getOne()

    if (!user)
      throw new AppError({
        message: SYSTEM_MESSAGES.USER_NOT_FOUND,
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
        message: SYSTEM_MESSAGES.INVALID_CREDENTIALS,
        status_code: STATUS_CODES.BAD_REQUEST,
        code: ERROR_CODES.INVALID_CREDENTIALS,
      })

    // Generate tokens
    const tokens = this.generate_tokens(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        ...(user.created_at && {
          created_at: user.created_at,
        }),
        ...(user.updated_at && {
          updated_at: user.updated_at,
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

  generate_refresh_token(user: UserEntity): string {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    }

    return this.fastify.jwt.refresh.sign(payload)
  }

  generate_access_token(user: UserEntity): string {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    }

    return this.fastify.jwt.access.sign(payload)
  }

  generate_tokens(user: UserEntity) {
    return {
      access_token: this.generate_access_token(user),
      refresh_token: this.generate_refresh_token(user),
    }
  }
}
