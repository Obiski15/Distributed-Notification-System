import { Type } from "class-transformer"
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
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
  @IsNotEmpty()
  notification_type: NotificationType

  @IsUUID()
  @IsNotEmpty()
  user: string

  @IsString()
  @IsNotEmpty()
  template_code: string

  @ValidateNested()
  @Type(() => UserDataDto)
  variables: UserDataDto

  @IsString()
  @IsNotEmpty()
  request_id: string

  @IsOptional()
  @IsInt()
  priority: number

  @IsOptional()
  @IsArray()
  push_tokens?: string[]
}
