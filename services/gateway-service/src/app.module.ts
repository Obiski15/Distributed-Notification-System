import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { AppController } from "./app.controller"
import { AppService } from "./app.service"
import { HealthController } from "./modules/health/health.controller"
import { NotificationsModule } from "./modules/notifications/notifications.module"
import { SharedModule } from "./modules/shared.module"
import { TemplateController } from "./modules/template/template.controller"
import { UserController } from "./modules/user/user.controller"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    NotificationsModule,
    SharedModule,
  ],
  controllers: [
    AppController,
    HealthController,
    UserController,
    TemplateController,
  ],
  providers: [AppService],
})
export class AppModule {}
