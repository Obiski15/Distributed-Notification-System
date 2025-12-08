import { config } from "@dns/shared/config/index"
import "reflect-metadata"
import { DataSource } from "typeorm"
import { User } from "../entities/user-entity"

export const UserDataSource = new DataSource({
  type: "mysql",
  url: process.env.USER_SERVICE_DB,
  logging: false,
  synchronize: config.is_dev,
  entities: [User],
  migrations: [],
  subscribers: [],
})
