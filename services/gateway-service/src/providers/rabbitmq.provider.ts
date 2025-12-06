import { config } from "@dns/shared/config/index"
import * as ERROR_CODES from "@dns/shared/constants/error-codes"
import * as STATUS_CODES from "@dns/shared/constants/status-codes"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import logger from "@dns/shared/utils/logger"
import {
  close_rabbitmq_connection,
  get_rabbitmq_channel,
} from "@dns/shared/utils/rabbitmq"
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import * as amqp from "amqplib"
import { CustomException } from "../common/exceptions/custom/custom-exceptions"

interface IPublish<T> {
  exchange?: string
  options: amqp.Options.Publish
  routingKey: string
  data: T
}

@Injectable()
export class RabbitMQProvider implements OnModuleInit, OnModuleDestroy {
  public channel: amqp.Channel

  async onModuleInit() {
    try {
      this.channel = await get_rabbitmq_channel(config.RABBITMQ_CONNECTION_URL)
      await this.channel.assertExchange(config.NOTIFICATION_EXCHANGE, "topic", {
        durable: true,
      })
    } catch (error) {
      logger.error(error, "❌ Fatal: Could not connect to RabbitMQ")
      throw new CustomException({
        message: SYSTEM_MESSAGES.SERVICE_UNAVAILABLE,
        status_code: STATUS_CODES.SERVICE_UNAVAILABLE,
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
        details: "Could not connect to RabbitMQ",
        is_operational: false,
      })
    }
  }

  async onModuleDestroy() {
    await close_rabbitmq_connection()
  }

  publish<T>({ routingKey: routing_key, options, data }: IPublish<T>) {
    this.channel.publish(
      config.NOTIFICATION_EXCHANGE,
      routing_key,
      Buffer.from(JSON.stringify(data)),
      { ...options, persistent: true },
    )
  }
}
