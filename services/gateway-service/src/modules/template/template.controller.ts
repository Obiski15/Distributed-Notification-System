import { config } from "@dns/shared/config/index"
import discover_service from "@dns/shared/utils/discover_service"
import { All, Controller, Req } from "@nestjs/common"
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from "@nestjs/swagger"
import { FastifyRequest } from "fastify"

import { Fetch } from "../../common/fetch"

@ApiTags("Templates")
@ApiBearerAuth("JWT-auth")
@Controller()
export class TemplateController {
  @ApiExcludeEndpoint()
  @All("templates*")
  async templateRoutes(@Req() request: FastifyRequest) {
    const service = await discover_service(config.TEMPLATE_SERVICE)
    const fetch_service = new Fetch(service, request)
    const data = await fetch_service.fetch_service(config.TEMPLATE_SERVICE)

    return data
  }
}
