import { Module } from "@nestjs/common"
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core"

import { GlobalFilter } from "./common/exceptions/filters/global-filter"
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor"

import { config } from "@dns/shared/config/index"
import { CacheModule } from "@nestjs/cache-manager"
import { JwtModule } from "@nestjs/jwt"
import { redisStore } from "cache-manager-redis-store"

import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler"
import { DEFAULT_LIMIT } from "./config/throttler.config"
import { AuthController } from "./modules/auth/auth.controller"
import { AuthGuard } from "./modules/auth/guards/auth.guard"
import { NotificationsModule } from "./modules/notifications/notifications.module"
import { SharedModule } from "./modules/shared.module"
import { TemplateController } from "./modules/template/template.controller"
import { UserModule } from "./modules/user/user.module"

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
    ThrottlerModule.forRoot({ throttlers: [DEFAULT_LIMIT] }),
    UserModule,
    NotificationsModule,
    SharedModule,
  ],
  controllers: [AuthController, TemplateController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalFilter,
    },
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
