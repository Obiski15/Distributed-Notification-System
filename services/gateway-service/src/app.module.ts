import { Module } from "@nestjs/common"
import { APP_FILTER, APP_GUARD } from "@nestjs/core"

import { GlobalFilter } from "./common/exceptions/filters/global-filter"

import { CacheModule } from "@nestjs/cache-manager"
import { JwtModule } from "@nestjs/jwt"
import { config } from "@shared/config/index"
import { redisStore } from "cache-manager-redis-store"

import { AuthController } from "./modules/auth/auth.controller"
import { AuthGuard } from "./modules/auth/guards/auth.guard"
import { NotificationsModule } from "./modules/notifications/notifications.module"
import { SharedModule } from "./modules/shared.module"
import { TemplateController } from "./modules/template/template.controller"
import { UserController } from "./modules/user/user.controller"

@Module({
  imports: [
    JwtModule.register({
      global: true,
      secret: config.JWT_ACCESS_SECRET,
    }),
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: config.REDIS_HOST,
            port: config.REDIS_PORT,
          },
          ttl: 0,
        }),
      }),
      isGlobal: true,
    }),
    NotificationsModule,
    SharedModule,
  ],
  controllers: [UserController, AuthController, TemplateController],
  providers: [
    {
      provide: APP_FILTER,
      useClass: GlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
