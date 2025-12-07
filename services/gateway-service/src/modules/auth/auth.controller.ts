import { config } from "@dns/shared/config/index"
import discover_service from "@dns/shared/utils/discover_service"
import { All, Controller, Req } from "@nestjs/common"
import { ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger"
import { FastifyRequest } from "fastify"

import { Throttle } from "@nestjs/throttler"
import { Fetch } from "../../common/fetch"
import { AUTH_LIMIT } from "../../config/throttler.config"
import { Public } from "../../decorators/public.decorator"

@ApiTags("Authentication")
@Controller()
export class AuthController {
  @Public()
  @Throttle({ default: AUTH_LIMIT })
  @ApiExcludeEndpoint()
  @All("auth*")
  async authRoutes(@Req() request: FastifyRequest) {
    const service = await discover_service(config.USER_SERVICE)

    const fetch_service = new Fetch(service, request)
    const data = await fetch_service.fetch_service(config.USER_SERVICE)
    return data
  }
}
