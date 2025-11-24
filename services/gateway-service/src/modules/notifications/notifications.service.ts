import { Injectable, Logger } from "@nestjs/common"
import Redis from "ioredis"

import { RabbitMQProvider } from "../../providers/rabbitmq.provider"
import { RedisProvider } from "../../providers/redis.provider"

import { UpdateNotificationStatusDto } from "./dto/notification-status.dto"
import { CreateNotificationDto } from "./dto/notification.dto"

export interface NotificationResponse {
  success: boolean
  message: string
  data: any
  meta: any
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name)
  private redis: Redis

  constructor(
    private readonly redisProvider: RedisProvider,
    private readonly rabbitmq: RabbitMQProvider,
  ) {
    this.redis = this.redisProvider.redis
  }

  handleNotification(
    payload: CreateNotificationDto,
    // headers?: any,
    // Promise<NotificationResponse>
  ) {
    const {
      notification_type,
      user_id,
      template_code,
      variables,
      request_id,
      priority,
      metadata,
    } = payload

    // if (!request_id) throw new BadRequestException("request_id is required")

    // // Fetch user from UsersService (circuit breaker + Consul handled internally)
    // let userRes
    // try {
    //   userRes = await this.usersService.forwardToUserService(
    //     "GET",
    //     "/api/v1/user",
    //     undefined,
    //     headers,
    //   )
    // } catch (err) {
    //   this.logger.error(
    //     "User service request failed",
    //     err?.response?.data || err.message,
    //   )
    //   return {
    //     success: false,
    //     message: "Failed to fetch user",
    //     data: null,
    //     meta: null,
    //   }
    // }

    // if (userRes?.success === false) {
    //   this.logger.error(
    //     `Failed to retrieve user due to service error: ${userRes.message}`,
    //   )
    //   return {
    //     success: false,
    //     message: userRes.message, // Return the specific error like "User Service unavailable"
    //     data: null,
    //     meta: null,
    //   }
    // }

    // const user = userRes?.data
    // if (!user) {
    //   return {
    //     success: false,
    //     message: "User not found",
    //     data: null,
    //     meta: null,
    //   }
    // }

    // const prefKey =
    //   notification_type === NotificationType.EMAIL
    //     ? "email_notification_enabled"
    //     : "push_notification_enabled"
    // if (!user.preferences || !user.preferences[prefKey]) {
    //   return {
    //     success: true,
    //     message: `${notification_type} notifications disabled by user`,
    //     data: { request_id, notification_type, priority },
    //     meta: null,
    //   }
    // }

    // const key = `notification:${request_id}`
    // const existing = JSON.parse((await this.redis.get(key)) || "{}")

    // if (existing) {
    //   if (["pending", "delivered"].includes(existing.status)) {
    //     return {
    //       success: true,
    //       message: "Notification already processed",
    //       data: { request_id, notification_type, priority },
    //       meta: null,
    //     }
    //   }
    //   if (existing.status === "failed") {
    //     return {
    //       success: true,
    //       message: "Notification previously failed",
    //       data: { request_id, notification_type, priority },
    //       meta: null,
    //     }
    //   }
    // } else {
    //   await this.redis.set(
    //     key,
    //     JSON.stringify({
    //       status: "pending",
    //       timestamp: new Date().toISOString(),
    //     }),
    //     "EX",
    //     60 * 60 * 24,
    //   )
    // }

    try {
      this.rabbitmq.publish({
        routingKey: notification_type,
        data: {
          notification_type,
          // email: user.email,
          user_id,
          // notification_id: key,
          template_code,
          variables,
          // push_tokens: user.push_tokens,
          request_id,
          priority,
          metadata,
        },
        options: { priority },
      })

      // return {
      //   success: true,
      //   message: `${notification_type} notification queued successfully`,
      //   data: { request_id, notification_type, priority },
      //   meta: null,
      // }
    } catch (err) {
      this.logger.error("Failed to publish to queue", err?.message || err)
      // return {
      //   success: false,
      //   message: "Failed to queue notification",
      //   data: null,
      //   meta: null,
      // }
    }
  }

  async updateStatus(
    notification_type: string,
    body: UpdateNotificationStatusDto,
  ): Promise<NotificationResponse> {
    const { notification_id, status, timestamp, error } = body
    if (!notification_id)
      return {
        success: false,
        message: "notification_id required",
        data: null,
        meta: null,
      }

    const key = `notification:${notification_id}`
    const record = {
      status,
      error: error || null,
      timestamp: timestamp || new Date().toISOString(),
    }

    await this.redis.set(key, JSON.stringify(record), "EX", 60 * 60 * 24)

    return {
      success: true,
      message: `${notification_type} notification status updated`,
      data: { notification_id, status, error },
      meta: null,
    }
  }

  async getStatus(request_id: string): Promise<NotificationResponse> {
    const key = `notification:${request_id}`
    const raw = await this.redis.get(key)
    if (!raw)
      return { success: false, message: "not found", data: null, meta: null }

    const parsed = JSON.parse(raw)
    return {
      success: true,
      message: "ok",
      data: { request_id, status: parsed },
      meta: null,
    }
  }
}
