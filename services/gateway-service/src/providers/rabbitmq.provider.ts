import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"

import * as amqp from "amqplib"

interface IPublish<T> {
  exchange?: string
  options: amqp.Options.Publish
  routingKey: string
  data: T
}

@Injectable()
export class RabbitMQProvider implements OnModuleInit, OnModuleDestroy {
  public channel: amqp.Channel
  private connection: amqp.ChannelModel
  private readonly RABBITMQ_URL: string
  private readonly EXCHANGE: string

  constructor(
    private readonly config: ConfigService,
    private readonly logger: Logger,
  ) {
    this.RABBITMQ_URL = this.config.get<string>("RABBITMQ_URL")!
    this.EXCHANGE = this.config.get<string>("RABBITMQ_EXCHANGE")!
  }

  async onModuleInit() {
    try {
      await this.connect()
      Logger.log("✅ Connected to RabbitMQ")
    } catch {
      Logger.log("❌ Fatal: Could not connect to RabbitMQ")
      // throw error
    }
  }

  async onModuleDestroy() {
    await this.disconnect()
    this.logger.log("Disconnected from RabbitMQ")
  }

  publish<T>({
    exchange = this.EXCHANGE,
    routingKey,
    options,
    data,
  }: IPublish<T>) {
    this.channel.publish(
      exchange,
      routingKey,
      Buffer.from(JSON.stringify(data)),
      { ...options, persistent: true },
    )
  }

  private async connect() {
    this.connection = await amqp.connect(this.RABBITMQ_URL)
    this.channel = await this.connection.createChannel()
    await this.channel.assertExchange(this.EXCHANGE, "direct", {
      durable: true,
    })
  }

  private async disconnect() {
    await this.channel.close()
    await this.connection.close()
  }
}
