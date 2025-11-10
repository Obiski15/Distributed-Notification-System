import { Injectable, Inject, BadRequestException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import Redis from 'ioredis';
import { CreateNotificationDto, NotificationType } from './dto/notification.dto';
import {
  UpdateNotificationStatusDto,
  NotificationStatus,
} from './dto/notification-status.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private redis: Redis;
  private channel: any;
  private exchange: string;

  constructor(
    @Inject('RABBITMQ_CONNECTION') private mqProvider: any,
    private readonly http: HttpService,
  ) {
    // mqProvider is { channel, exchange }
    this.channel = mqProvider?.channel;
    this.exchange = mqProvider?.exchange || process.env.RABBITMQ_EXCHANGE || 'notifications.direct';
    this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  // Handle create notification request
  async handleNotification(payload: CreateNotificationDto) {
    const {
      notification_type,
      user_id,
      template_code,
      variables,
      request_id,
      priority,
      metadata,
    } = payload;

    if (!request_id) throw new BadRequestException('request_id is required');

    // Idempotency check
    const key = `notification:${request_id}`;
    const existing = await this.redis.get(key);
    if (existing) {
      this.logger.warn(`Duplicate request detected: ${request_id}`);
      throw new BadRequestException('Duplicate request_id detected');
    }

    // Fetch user details from User Service
    const userUrl = `${process.env.USER_SERVICE_URL}/api/v1/users/${user_id}`;
    let userRes;
    try {
      userRes = await lastValueFrom(this.http.get(userUrl));
    } catch (err) {
      this.logger.error('User service request failed', err?.response?.data || err.message);
      throw new BadRequestException('Failed to fetch user');
    }
    const user = userRes?.data?.data;
    if (!user) throw new BadRequestException('User not found');

    // Validate user preference for this notification_type
    const prefKey = notification_type === NotificationType.EMAIL ? 'email' : 'push';
    if (!user.preferences || !user.preferences[prefKey]) {
      throw new BadRequestException(`${notification_type} notifications disabled for user`);
    }

    // Fetch template from Template Service by code/path
    const templateUrl = `${process.env.TEMPLATE_SERVICE_URL}/api/v1/templates/${encodeURIComponent(
      template_code,
    )}`;
    let templateRes;
    try {
      templateRes = await lastValueFrom(this.http.get(templateUrl));
    } catch (err) {
      this.logger.error('Template service request failed', err?.response?.data || err.message);
      throw new BadRequestException('Failed to fetch template');
    }
    const template = templateRes?.data?.data;
    if (!template) throw new BadRequestException('Template not found');

    // Construct message that consumers (email/push) expect
    const message = {
      request_id,
      notification_type,
      user_id,
      user,
      template_code,
      template,
      variables,
      priority: Number(priority) || 0,
      metadata: metadata || {},
      created_at: new Date().toISOString(),
    };

    // Publish to MQ
    try {
      const routingKey = notification_type; // 'email' or 'push'
      const payloadBuffer = Buffer.from(JSON.stringify(message));
      await this.channel.publish(this.exchange, routingKey, payloadBuffer, {
        persistent: true,
        priority: Math.min(Math.max(Number(priority) || 0, 0), 9), // map priority within 0-9
      });
    } catch (err) {
      this.logger.error('Failed to publish to queue', err?.message || err);
      // Optionally push to failed queue directly
      throw new BadRequestException('Failed to queue notification');
    }

    // Save initial status in Redis
    await this.redis.set(
      key,
      JSON.stringify({ status: 'queued', created_at: new Date().toISOString() }),
      'EX',
      60 * 60 * 24, // keep for 24h (adjust as you like)
    );

    return {
      message: `${notification_type} notification queued successfully`,
      data: { request_id, notification_type, priority },
      meta: null,
    };
  }

  // Called by downstream services to update status
  async updateStatus(notification_type: string, body: UpdateNotificationStatusDto) {
    const { notification_id, status, timestamp, error } = body;

    if (!notification_id) throw new BadRequestException('notification_id required');

    const key = `notification:${notification_id}`;

    const record = {
      status,
      error: error || null,
      updated_at: timestamp || new Date().toISOString(),
      source: notification_type,
    };

    await this.redis.set(key, JSON.stringify(record), 'EX', 60 * 60 * 24 * 7); // keep for 7 days

    // Optionally: append to a list of status events for that notification
    await this.redis.lpush(`notification_events:${notification_id}`, JSON.stringify(record));
    await this.redis.ltrim(`notification_events:${notification_id}`, 0, 100); // keep last 100

    return {
      message: `${notification_type} notification status updated`,
      data: { notification_id, status, error },
      meta: null,
    };
  }

  async getStatus(request_id: string) {
    const key = `notification:${request_id}`;
    const raw = await this.redis.get(key);
    if (!raw) {
      return { message: 'not found', data: null, meta: null };
    }
    const parsed = JSON.parse(raw);
    // Also return recent events if present
    const eventsRaw = await this.redis.lrange(`notification_events:${request_id}`, 0, 50);
    const events = eventsRaw.map(e => {
      try { return JSON.parse(e); } catch { return e; }
    });

    return { message: 'ok', data: { request_id, status: parsed, events }, meta: null };
  }
}

