import { All, Controller, OnModuleInit, Req } from "@nestjs/common"
import { config } from "@shared/config/index"
import type { Service } from "@shared/types/index"
import discover_service from "@shared/utils/discover_service"
import { FastifyRequest } from "fastify"

import { Fetch } from "../../common/fetch"
import { Public } from "../../decorators/public.decorator"

@Controller()
export class AuthController implements OnModuleInit {
  private service: Service

  async onModuleInit() {
    this.service = await discover_service(config.USER_SERVICE)
  }

  @Public()
  @All("auth*")
  async authRoutes(@Req() request: FastifyRequest) {
    const fetchService = new Fetch(this.service, request)
    const data = await fetchService.fetch(config.USER_SERVICE)
    return data
  }
}
