import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import { Inject, Injectable, NotFoundException } from "@nestjs/common"

import { RabbitMQProvider } from "../../providers/rabbitmq.provider"

import logger from "@dns/shared/utils/logger"
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager"
import { UserService } from "../user/user.service"
import { UpdateNotificationStatusDto } from "./dto/notification-status.dto"
import { CreateNotificationDto, NotificationType } from "./dto/notification.dto"

export interface NotificationResponse {
  success: boolean
  message: string
  data: Record<string, unknown>
}

export enum NotificationStatus {
  PENDING = "pending",
  DELIVERED = "delivered",
  FAILED = "failed",
}

@Injectable()
export class NotificationsService {
  CACHE_TTL_MS = 24 * 60 * 60 * 1000

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly rabbitmq: RabbitMQProvider,
    private readonly userService: UserService,
  ) {}

  async handle_notification(payload: CreateNotificationDto) {
    const {
      notification_type,
      template_code,
      variables,
      user: user_id,
      request_id,
      priority,
    } = payload

    // find user
    const user = await this.userService.get_user(user_id)

    const pref_key =
      notification_type === NotificationType.EMAIL
        ? "email_notification_enabled"
        : "push_notification_enabled"
    if (
      !user.preferences ||
      !(user.preferences as Record<string, boolean>)[pref_key]
    ) {
      return {
        success: true,
        message: `${notification_type} ${SYSTEM_MESSAGES.NOTIFICATIONS_DISABLED}`,
        data: { request_id, notification_type, priority },
      }
    }

    const key = this.notification_key(request_id)
    const existing =
      ((await this.cache.get(key)) as Record<string, unknown> | null) || null

    const active_statuses = Object.values(NotificationStatus).filter(
      status => status !== NotificationStatus.FAILED,
    )

    if (existing) {
      if (
        active_statuses.includes(
          existing.status as Exclude<
            NotificationStatus,
            NotificationStatus.FAILED
          >,
        )
      ) {
        return {
          success: true,
          message: SYSTEM_MESSAGES.NOTIFICATION_ALREADY_PROCESSED,
          data: existing,
        }
      }
      if (existing.status === NotificationStatus.FAILED) {
        return {
          success: true,
          message: SYSTEM_MESSAGES.NOTIFICATION_PREVIOUSLY_FAILED,
          data: existing,
        }
      }
    } else {
      await this.cache.set(
        key,
        {
          request_id,
          status: NotificationStatus.PENDING,
          notification_type,
          priority,
          timestamp: new Date().toISOString(),
        },
        this.CACHE_TTL_MS,
      )
    }

    try {
      this.rabbitmq.publish({
        routingKey: notification_type,
        data: {
          notification_type,
          email: user.email,
          user_id: user?.id,
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
        message: `${notification_type} ${SYSTEM_MESSAGES.NOTIFICATION_QUEUED}`,
        data: { request_id, notification_type, priority },
      }
    } catch (error) {
      logger.error(error)
      return {
        success: false,
        message: SYSTEM_MESSAGES.QUEUE_PUBLISH_FAILED,
        data: { request_id, notification_type, priority },
      }
    }
  }

  async update_status(
    notification_type: string,
    body: UpdateNotificationStatusDto,
  ): Promise<NotificationResponse> {
    const { request_id, status, timestamp, error } = body
    const key = this.notification_key(request_id)
    const existing =
      ((await this.cache.get(key)) as Record<string, unknown> | null) || {}

    const record = {
      ...existing,
      status,
      error: error || null,
      timestamp: timestamp || new Date().toISOString(),
    }

    await this.cache.set(key, record, this.CACHE_TTL_MS)

    return {
      success: true,
      message: `${notification_type} ${SYSTEM_MESSAGES.NOTIFICATION_STATUS_UPDATED}`,
      data: { key, status, error },
    }
  }

  async get_status(request_id: string): Promise<NotificationResponse> {
    const key = this.notification_key(request_id)

    const data = (await this.cache.get(key)) as Record<string, unknown>
    if (!data)
      throw new NotFoundException(SYSTEM_MESSAGES.NOTIFICATION_NOT_FOUND)

    return {
      success: true,
      message: SYSTEM_MESSAGES.NOTIFICATION_RETRIEVED,
      data,
    }
  }

  private notification_key = (id: string) => {
    return `notification:${id}`
  }
}
