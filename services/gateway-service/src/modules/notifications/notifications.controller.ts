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
import {
  NotificationResponse,
  NotificationsService,
} from "./notifications.service"

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Queue notifications (email | push)
  @Post("/")
  @HttpCode(HttpStatus.ACCEPTED)
  queueNotification() {
    return "notification triggered"
    //  this.notificationsService.handleNotification(body)
  }

  // Update notification status (email/push)
  @Post("/:notification_preference/status")
  async updateStatus(
    @Param("notification_preference") notification_preference: string,
    @Body() body: UpdateNotificationStatusDto,
  ): Promise<NotificationResponse> {
    return await this.notificationsService.updateStatus(
      notification_preference,
      body,
    )
  }

  // Get notification status by request_id
  @Get("/:request_id")
  async getStatus(
    @Param("request_id") request_id: string,
  ): Promise<NotificationResponse> {
    return await this.notificationsService.getStatus(request_id)
  }
}
