import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common"
import { UpdateNotificationStatusDto } from "./dto/notification-status.dto"
import { CreateNotificationDto } from "./dto/notification.dto"
import {
  NotificationResponse,
  NotificationsService,
} from "./notifications.service"

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // Queue notifications
  @Post("/")
  @HttpCode(HttpStatus.ACCEPTED)
  queueNotification(@Body() body: CreateNotificationDto) {
    return this.notificationService.handleNotification(body)
  }

  // Update notification status
  @Post("/:notification_preference/status")
  @HttpCode(HttpStatus.CREATED)
  updateStatus(
    @Param("notification_preference") notification_preference: string,
    @Body() body: UpdateNotificationStatusDto,
  ): Promise<NotificationResponse> {
    return this.notificationService.updateStatus(notification_preference, body)
  }

  @Get("/:request_id")
  getStatus(
    @Param("request_id") request_id: string,
  ): Promise<NotificationResponse> {
    return this.notificationService.getStatus(request_id)
  }
}
