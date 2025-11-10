import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/notification.dto';
import { UpdateNotificationStatusDto } from './dto/notification-status.dto';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Create / queue a notification (email | push)
  @Post('/')
  @HttpCode(HttpStatus.ACCEPTED)
  async createNotification(@Body() body: CreateNotificationDto) {
    const result = await this.notificationsService.handleNotification(body);
    return {
      success: true,
      data: result.data || null,
      message: result.message || 'notification queued',
      meta: result.meta || null,
    };
  }

  // Receive status updates from downstream services (email/push)
  @Post('/:notification_type/status')
  async updateStatus(
    @Param('notification_type') notification_type: string,
    @Body() body: UpdateNotificationStatusDto,
  ) {
    const result = await this.notificationsService.updateStatus(
      notification_type,
      body,
    );
    return {
      success: true,
      data: result.data || null,
      message: result.message || `${notification_type} status updated`,
      meta: result.meta || null,
    };
  }

  // Query status by request_id (notification_id)
  @Get('/:request_id')
  async getStatus(@Param('request_id') request_id: string) {
    const result = await this.notificationsService.getStatus(request_id);
    return {
      success: true,
      data: result.data || null,
      message: result.message || null,
      meta: result.meta || null,
    };
  }

  // Health check for notifications area
  @Get('/health')
  health() {
    return { success: true, data: { status: 'ok' }, message: 'healthy', meta: null };
  }
}
