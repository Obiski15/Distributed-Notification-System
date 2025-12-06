import { config } from "@dns/shared/config/index"
import type { Service } from "@dns/shared/types/index"
import discover_service from "@dns/shared/utils/discover_service"
import { All, Controller, OnModuleInit, Req } from "@nestjs/common"
import { FastifyRequest } from "fastify"

import { Throttle } from "@nestjs/throttler"
import { Fetch } from "../../common/fetch"
import { AUTH_LIMIT } from "../../config/throttler.config"
import { Public } from "../../decorators/public.decorator"

@Throttle({ default: AUTH_LIMIT })
@Controller()
export class AuthController implements OnModuleInit {
  private service: Service

  async onModuleInit() {
    this.service = await discover_service(config.USER_SERVICE)
  }

  @Public()
  @All("auth*")
  async authRoutes(@Req() request: FastifyRequest) {
    const fetch_service = new Fetch(this.service, request)
    const data = await fetch_service.fetch_service(config.USER_SERVICE)
    return data
  }
}
