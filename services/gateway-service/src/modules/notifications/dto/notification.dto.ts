import {
  IsEnum,
  IsString,
  IsUUID,
  IsInt,
  IsOptional,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum NotificationType {
  EMAIL = 'email',
  PUSH = 'push',
}

export class UserDataDto {
  @IsString()
  name: string;

  @IsString()
  link: string;

  @IsOptional()
  @IsObject()
  meta?: Record<string, any>;
}

export class CreateNotificationDto {
  @IsEnum(NotificationType)
  notification_type: NotificationType;

  @IsUUID()
  user_id: string;

  @IsString()
  template_code: string;

  @ValidateNested()
  @Type(() => UserDataDto)
  variables: UserDataDto;

  @IsString()
  request_id: string;

  @IsInt()
  priority: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
