import { All, Controller, Inject, OnModuleInit, Req } from "@nestjs/common"
import { config } from "@shared/config/index"
import { FastifyRequest } from "fastify"

import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager"
import { Discover } from "../../common/discover"
import { Fetch } from "../../common/fetch"

interface AuthenticatedRequest extends FastifyRequest {
  user: { id: string }
}

@Controller()
export class UserController implements OnModuleInit {
  private service: Service
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async onModuleInit() {
    this.service = await new Discover().discover(config.USER_SERVICE)
  }

  @All("users*")
  async userRoutes(@Req() request: AuthenticatedRequest) {
    const fetchService = new Fetch(this.service, request)
    const data = await fetchService.fetch(config.USER_SERVICE)

    if (request.method !== "GET")
      await this.cache.del(`user:${request.user.id}`)

    return data
  }
}
