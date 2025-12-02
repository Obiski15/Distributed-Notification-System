import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from "@nestjs/common"

import { RabbitMQProvider } from "../../providers/rabbitmq.provider"

import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager"
import { UpdateNotificationStatusDto } from "./dto/notification-status.dto"
import { CreateNotificationDto, NotificationType } from "./dto/notification.dto"

export interface NotificationResponse {
  success: boolean
  message: string
  data: Record<string, unknown>
}

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly rabbitmq: RabbitMQProvider,
  ) {}

  async handleNotification(payload: CreateNotificationDto) {
    const {
      notification_type,
      template_code,
      variables,
      request_id,
      priority,
    } = payload

    if (!request_id) throw new BadRequestException("request_id is required")

    // find user
    const user: Record<string, unknown> = {}

    const prefKey =
      notification_type === NotificationType.EMAIL
        ? "email_notification_enabled"
        : "push_notification_enabled"
    if (
      !user.preferences ||
      !(user.preferences as Record<string, boolean>)[prefKey]
    ) {
      return {
        success: true,
        message: `${notification_type} notifications disabled by user`,
        data: { request_id, notification_type, priority },
      }
    }

    const key = `notification:${request_id}`
    const existing: { status: string } | null =
      (await this.cache.get(key)) || null

    if (existing) {
      if (["pending", "delivered"].includes(existing.status)) {
        return {
          success: true,
          message: "Notification already processed",
          data: { request_id, notification_type, priority },
          meta: null,
        }
      }
      if (existing.status === "failed") {
        return {
          success: true,
          message: "Notification previously failed",
          data: { request_id, notification_type, priority },
          meta: null,
        }
      }
    } else {
      await this.cache.set(
        key,
        {
          status: "pending",
          timestamp: new Date().toISOString(),
        },
        60 * 60 * 24,
      )
    }

    try {
      this.rabbitmq.publish({
        routingKey: notification_type,
        data: {
          notification_type,
          email: user.email,
          user_id: user?.id,
          notification_id: key,
          template_code,
          variables,
          push_tokens: user?.push_tokens,
          request_id,
          priority,
        },
        options: { priority },
      })

      return {
        success: true,
        message: `${notification_type} notification queued successfully`,
        data: { request_id, notification_type, priority },
      }
    } catch {
      throw new InternalServerErrorException("Failed to queue email request")
    }
  }

  async updateStatus(
    notification_type: string,
    body: UpdateNotificationStatusDto,
  ): Promise<NotificationResponse> {
    const { notification_id, status, timestamp, error } = body

    const key = `notification:${notification_id}`
    const record = {
      status,
      error: error || null,
      timestamp: timestamp || new Date().toISOString(),
    }

    await this.cache.set(key, JSON.stringify(record), 60 * 60 * 24)

    return {
      success: true,
      message: `${notification_type} notification status updated`,
      data: { notification_id, status, error },
    }
  }

  async getStatus(request_id: string): Promise<NotificationResponse> {
    const key = `notification:${request_id}`
    const data = (await this.cache.get(key)) as Record<string, unknown>
    if (!data) throw new NotFoundException("Not found")

    return {
      success: true,
      message: "ok",
      data,
    }
  }
}
