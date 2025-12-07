import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from "@nestjs/common"
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger"
import { Throttle } from "@nestjs/throttler"
import { SENSITIVE_LIMIT } from "../../config/throttler.config"
import { AllowInternal } from "../../decorators/isInternal.decorator"
import { UpdateNotificationStatusDto } from "./dto/notification-status.dto"
import { CreateNotificationDto } from "./dto/notification.dto"
import {
  NotificationResponse,
  NotificationsService,
} from "./notifications.service"

@ApiTags("Notifications")
@ApiBearerAuth("JWT-auth")
@Controller("notifications")
@AllowInternal()
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  // Queue notifications
  @ApiOperation({
    summary: "Send notification",
    description: "Queue a notification for sending via email and/or push",
  })
  @ApiBody({ type: CreateNotificationDto })
  @ApiResponse({ status: 202, description: "Notification queued successfully" })
  @ApiResponse({ status: 400, description: "Invalid notification data" })
  @ApiResponse({ status: 429, description: "Too many requests" })
  @Throttle({ default: SENSITIVE_LIMIT })
  @Post("/send")
  @HttpCode(HttpStatus.ACCEPTED)
  queueNotification(@Body() body: CreateNotificationDto) {
    return this.notificationService.handle_notification(body)
  }

  // Update notification status
  @ApiOperation({
    summary: "Update notification status",
    description: "Update the delivery status of a notification",
  })
  @ApiParam({
    name: "notification_preference",
    description: "Notification type (email or push)",
  })
  @ApiBody({ type: UpdateNotificationStatusDto })
  @ApiResponse({ status: 201, description: "Status updated successfully" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  @Throttle({ default: SENSITIVE_LIMIT })
  @Post("/:notification_preference/status")
  @HttpCode(HttpStatus.CREATED)
  updateStatus(
    @Param("notification_preference") notification_preference: string,
    @Body() body: UpdateNotificationStatusDto,
  ): Promise<NotificationResponse> {
    return this.notificationService.update_status(notification_preference, body)
  }

  @ApiOperation({
    summary: "Get notification status",
    description: "Retrieve the delivery status of a notification by request ID",
  })
  @ApiParam({
    name: "request_id",
    description: "Unique notification request ID",
  })
  @ApiResponse({ status: 200, description: "Status retrieved successfully" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  @Get("/:request_id")
  getStatus(
    @Param("request_id") request_id: string,
  ): Promise<NotificationResponse> {
    return this.notificationService.get_status(request_id)
  }
}
