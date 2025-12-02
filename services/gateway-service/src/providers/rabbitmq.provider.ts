import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common"
import { config } from "@shared/config/index"
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

  constructor(private readonly logger: Logger) {}

  async onModuleInit() {
    try {
      await this.connect()
      Logger.log("✅ Connected to RabbitMQ")
    } catch {
      throw new CustomException("❌ Fatal: Could not connect to RabbitMQ", 500)
    }
  }

  async onModuleDestroy() {
    await this.disconnect()
    this.logger.log("Disconnected from RabbitMQ")
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
