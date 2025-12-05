import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { config } from "@shared/config/index"
import * as ERROR_CODES from "@shared/constants/error-codes"
import * as STATUS_CODES from "@shared/constants/status-codes"
import * as SYSTEM_MESSAGES from "@shared/constants/system-message"
import logger from "@shared/utils/logger"
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
  public channel!: amqp.Channel
  private connection!: amqp.ChannelModel

  async onModuleInit() {
    try {
      await this.connect()
      logger.info("✅ Connected to RabbitMQ")
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
    await this.disconnect()
    logger.info("Disconnected from RabbitMQ")
  }

  publish<T>({ routingKey, options, data }: IPublish<T>) {
    this.channel.publish(
      config.NOTIFICATION_EXCHANGE,
      routingKey,
      Buffer.from(JSON.stringify(data)),
      { ...options, persistent: true },
    )
  }

  private async connect() {
    this.connection = await amqp.connect(config.RABBITMQ_CONNECTION_URL)
    this.channel = await this.connection.createChannel()
    await this.channel.assertExchange(config.NOTIFICATION_EXCHANGE, "topic", {
      durable: true,
    })
  }

  private async disconnect() {
    await this.channel.close()
    await this.connection.close()
  }
}
