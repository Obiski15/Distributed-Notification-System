import { config } from "@dns/shared/config/index"
import "reflect-metadata"
import { DataSource } from "typeorm"
import { Template } from "../entities/template-entity"

export const TemplateDataSource = new DataSource({
  type: "mysql",
  url: process.env.TEMPLATE_SERVICE_DB,
  logging: false,
  synchronize: config.is_dev,
  entities: [Template],
  migrations: [],
  subscribers: [],
})
