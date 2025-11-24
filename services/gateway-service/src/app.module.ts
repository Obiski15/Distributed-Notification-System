import { Module } from "@nestjs/common"
import { ConfigModule } from "@nestjs/config"
import { APP_FILTER } from "@nestjs/core"

import { GlobalFilter } from "./common/exceptions/filters/global-filter"

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
  controllers: [UserController, TemplateController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalFilter,
    },
  ],
})
export class AppModule {}
