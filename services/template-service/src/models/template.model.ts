import * as ERROR_CODES from "@dns/shared/constants/error-codes"
import * as STATUS_CODES from "@dns/shared/constants/status-codes"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import AppError from "@dns/shared/utils/AppError.js"
import { TemplateDataSource } from "../config/datasource"
import { Template, TemplateType } from "../entities/template-entity"

export interface CreateTemplateBody {
  name: string
  subject: string
  body: string
  type?: TemplateType
  image_url?: string
  action_url?: string
  metadata?: Record<string, any>
  version?: number
}

const templateRepo = TemplateDataSource.getRepository(Template)

export const find_all_templates = async () => {
  const templates = await templateRepo.find()

  return templates
}

export const create_template = async (body: Partial<Template>) => {
  const existing_template = await templateRepo.findOne({
    where: {
      name: body.name,
      type: body.type ?? TemplateType.EMAIL,
    },
    order: { version: "DESC" },
  })

  const version = existing_template ? existing_template.version + 1 : 1

  const template = await templateRepo.save({ ...body, version })

  return template
}

export const find_template = async (
  template_code: string,
  version?: number,
) => {
  const filters = { name: template_code } as Record<string, unknown>
  if (version !== undefined) {
    filters.version = version
  }

  const template = await templateRepo.findOne({
    where: filters,
    order: {
      version: "DESC",
    },
  })

  if (!template)
    throw new AppError({
      message: SYSTEM_MESSAGES.TEMPLATE_NOT_FOUND,
      status_code: STATUS_CODES.NOT_FOUND,
      code: ERROR_CODES.TEMPLATE_NOT_FOUND,
    })

  return template
}

export const update_template = async (
  template_id: string,
  fields: Partial<Template>,
) => {
  if (!fields || !Object.keys(fields).length)
    throw new AppError({
      message: SYSTEM_MESSAGES.NO_VALID_TEMPLATE_UPDATE_FIELDS,
      status_code: STATUS_CODES.BAD_REQUEST,
      code: ERROR_CODES.INVALID_INPUT,
    })

  const template = await templateRepo.findOne({
    where: {
      id: template_id,
    },
  })

  if (!template) {
    throw new AppError({
      message: SYSTEM_MESSAGES.TEMPLATE_NOT_FOUND,
      status_code: STATUS_CODES.NOT_FOUND,
      code: ERROR_CODES.TEMPLATE_NOT_FOUND,
    })
  }

  await templateRepo.update({ id: template_id }, fields)

  return fields
}

export const delete_template = async (template_id: string) => {
  const template = await templateRepo.findOne({
    where: {
      id: template_id,
    },
  })

  if (!template) {
    throw new AppError({
      message: "Template not found",
      status_code: STATUS_CODES.NOT_FOUND,
      code: ERROR_CODES.TEMPLATE_NOT_FOUND,
    })
  }

  await templateRepo.delete({ id: template_id })
}
