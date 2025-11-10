import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RabbitMQProvider } from './modules/queues/rabbitmq.provider';

@Module({
  imports: [
    HttpModule.register({
      timeout: 5000,
      maxRedirects: 5,
    }),
    NotificationsModule,
  ],
  providers: [RabbitMQProvider],
  exports: [RabbitMQProvider],
})
export class AppModule {}

