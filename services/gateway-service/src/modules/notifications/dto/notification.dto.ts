import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator"

export enum NotificationType {
  EMAIL = "email",
  PUSH = "push",
}

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  @IsNotEmpty()
  notification_type: NotificationType

  @IsUUID()
  @IsNotEmpty()
  user_id: string

  @IsString()
  @IsNotEmpty()
  template_code: string

  @IsObject()
  @IsNotEmpty()
  variables: Record<string, string>

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
