import { HttpModule } from "@nestjs/axios"
import { Module } from "@nestjs/common"

import { RabbitMQProvider } from "../../providers/rabbitmq.provider"
import { NotificationsController } from "./notifications.controller"
import { NotificationsService } from "./notifications.service"

@Module({
  imports: [HttpModule],
  controllers: [NotificationsController],
  providers: [NotificationsService, RabbitMQProvider],
  exports: [],
})
export class NotificationsModule {}
