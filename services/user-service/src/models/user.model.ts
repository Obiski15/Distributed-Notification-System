import * as ERROR_CODES from "@dns/shared/constants/error-codes"
import * as STATUS_CODES from "@dns/shared/constants/status-codes"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import AppError from "@dns/shared/utils/AppError"

import { UserDataSource } from "../config/datasource"
import { User as UserEntity } from "../entities/user-entity"
import { BaseModel } from "./base.model"

const userRepository = UserDataSource.getRepository(UserEntity)

export class UserModel extends BaseModel {
  update_user = async (data: UpdateUser, id: string) => {
    if (data.email) {
      const existing_user = await this.find_by_email(data.email)

      if (!existing_user)
        throw new AppError({
          message: SYSTEM_MESSAGES.USER_NOT_FOUND,
          status_code: STATUS_CODES.NOT_FOUND,
          code: ERROR_CODES.USER_NOT_FOUND,
        })

      if (existing_user.id !== id)
        throw new AppError({
          message: SYSTEM_MESSAGES.USER_ALREADY_EXISTS,
          status_code: STATUS_CODES.CONFLICT,
          code: ERROR_CODES.USER_ALREADY_EXISTS,
        })
    }

    const updatedUser = await userRepository.update(id, data)

    return updatedUser
  }

  update_preferences = async (data: UpdatePreferences, id: string) => {
    const user = await this.find_by_id(id)

    if (!user)
      throw new AppError({
        message: SYSTEM_MESSAGES.USER_NOT_FOUND,
        status_code: STATUS_CODES.NOT_FOUND,
        code: ERROR_CODES.USER_NOT_FOUND,
      })

    const updated_preferences = { ...user.preferences, ...data.preferences }

    await userRepository.update(id, { preferences: updated_preferences })
  }

  push_tokens = async (token: string, id: string) => {
    const user = await this.find_by_id(id)

    if (!user)
      throw new AppError({
        message: SYSTEM_MESSAGES.USER_NOT_FOUND,
        status_code: STATUS_CODES.NOT_FOUND,
        code: ERROR_CODES.USER_NOT_FOUND,
      })

    const current_tokens = user.push_tokens || []

    if (current_tokens.includes(token))
      return SYSTEM_MESSAGES.PUSH_TOKEN_ALREADY_EXISTS

    const updated_tokens = [...current_tokens, token]

    await userRepository.update(id, { push_tokens: updated_tokens })

    return SYSTEM_MESSAGES.PUSH_TOKEN_UPDATED
  }
}
