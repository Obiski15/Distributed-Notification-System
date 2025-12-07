import { config } from "@dns/shared/config/index"
import { All, Controller, Inject, Req } from "@nestjs/common"
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger"
import { FastifyRequest } from "fastify"

import discover_service from "@dns/shared/utils/discover_service"
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager"
import { Fetch } from "../../common/fetch"

interface AuthenticatedRequest extends FastifyRequest {
  user: { id: string }
}

@ApiTags("Users")
@ApiBearerAuth("JWT-auth")
@Controller()
export class UserController {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  @ApiExcludeEndpoint()
  @All("users*")
  async userRoutes(@Req() request: AuthenticatedRequest) {
    const service = await discover_service(config.USER_SERVICE)
    const fetch_service = new Fetch(service, request)
    const data = await fetch_service.fetch_service(config.USER_SERVICE)

    if (request.method !== "GET")
      await this.cache.del(`user:${request.user.id}`)

    return data
  }
}
