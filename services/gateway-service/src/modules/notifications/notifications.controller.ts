import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"
import { SENSITIVE_LIMIT } from "../../config/throttler.config"
import { AllowInternal } from "../../decorators/isInternal.decorator"
import { UpdateNotificationStatusDto } from "./dto/notification-status.dto"
import { CreateNotificationDto } from "./dto/notification.dto"
import {
  NotificationResponse,
  NotificationsService,
} from "./notifications.service"

@Controller("notifications")
@AllowInternal()
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // Queue notifications
  @Throttle({ default: SENSITIVE_LIMIT })
  @Post("/send")
  @HttpCode(HttpStatus.ACCEPTED)
  queueNotification(@Body() body: CreateNotificationDto) {
    return this.notificationService.handle_notification(body)
  }

  // Update notification status
  @Throttle({ default: SENSITIVE_LIMIT })
  @Post("/:notification_preference/status")
  @HttpCode(HttpStatus.CREATED)
  updateStatus(
    @Param("notification_preference") notification_preference: string,
    @Body() body: UpdateNotificationStatusDto,
  ): Promise<NotificationResponse> {
    return this.notificationService.update_status(notification_preference, body)
  }

  @Get("/:request_id")
  getStatus(
    @Param("request_id") request_id: string,
  ): Promise<NotificationResponse> {
    return this.notificationService.get_status(request_id)
  }
}
