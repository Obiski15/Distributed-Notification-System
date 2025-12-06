import { config } from "@dns/shared/config/index"
import type { Service } from "@dns/shared/types/index"
import { All, Controller, Inject, OnModuleInit, Req } from "@nestjs/common"
import { FastifyRequest } from "fastify"

import discover_service from "@dns/shared/utils/discover_service"
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager"
import { Fetch } from "../../common/fetch"

interface AuthenticatedRequest extends FastifyRequest {
  user: { id: string }
}

@Controller()
export class UserController implements OnModuleInit {
  private service: Service
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async onModuleInit() {
    this.service = await discover_service(config.USER_SERVICE)
  }

  @All("users*")
  async userRoutes(@Req() request: AuthenticatedRequest) {
    const fetch_service = new Fetch(this.service, request)
    const data = await fetch_service.fetch_service(config.USER_SERVICE)

    if (request.method !== "GET")
      await this.cache.del(`user:${request.user.id}`)

    return data
  }
}
