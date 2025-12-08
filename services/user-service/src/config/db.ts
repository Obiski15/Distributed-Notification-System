import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import logger from "@dns/shared/utils/logger"
import { UserDataSource } from "./datasource"

export const db_init = async () => {
  try {
    if (!UserDataSource.isInitialized) {
      await UserDataSource.initialize()

      logger.info(SYSTEM_MESSAGES.DATABASE_INITIALIZED)
    }
  } catch (error) {
    logger.error(SYSTEM_MESSAGES.DATABASE_INITIALIZATION_ERROR)
    throw error
  }
}

export const db_destroy = async () => {
  try {
    if (UserDataSource.isInitialized) {
      await UserDataSource.destroy()
      logger.info(SYSTEM_MESSAGES.DATABASE_CONNECTION_CLOSED)
    }
  } catch {
    logger.error(SYSTEM_MESSAGES.DATABASE_CONNECTION_CLOSE_ERROR)
  }
}
