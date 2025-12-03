import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator"

export enum NotificationStatus {
  DELIVERED = "delivered",
  PENDING = "pending",
  FAILED = "failed",
}

export class UpdateNotificationStatusDto {
  @IsString()
  request_id: string

  @IsEnum(NotificationStatus)
  status: NotificationStatus

  @IsOptional()
  @IsDateString()
  timestamp?: string

  @IsOptional()
  @IsString()
  error?: string
}
