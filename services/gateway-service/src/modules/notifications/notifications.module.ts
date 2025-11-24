import { HttpModule } from "@nestjs/axios"
import { Module } from "@nestjs/common"

import { RabbitMQProvider } from "../../providers/rabbitmq.provider"
import { RedisProvider } from "../../providers/redis.provider"
import { NotificationsController } from "./notifications.controller"
import { NotificationsService } from "./notifications.service"

@Module({
  imports: [HttpModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, RedisProvider, RabbitMQProvider],
  exports: [],
})
export class NotificationsModule {}
