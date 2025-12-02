import { Type } from "class-transformer"
import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from "class-validator"

export enum NotificationType {
  EMAIL = "email",
  PUSH = "push",
}

export class UserDataDto {
  @IsString()
  name: string

  @IsString()
  link: string
}

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  notification_type: NotificationType

  @IsUUID()
  user: string

  @IsString()
  template_code: string

  @ValidateNested()
  @Type(() => UserDataDto)
  variables: UserDataDto

  @IsString()
  request_id: string

  @IsOptional()
  @IsInt()
  priority: number

  @IsOptional()
  @IsArray()
  push_tokens?: string[]
}
