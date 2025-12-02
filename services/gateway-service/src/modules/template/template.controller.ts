import { All, Controller, Req } from "@nestjs/common"
import { config } from "@shared/config/index"
import { FastifyRequest } from "fastify"

import { Discover } from "../../common/discover"
import { Fetch } from "../../common/fetch"

@Controller()
export class TemplateController {
  private service: Service

  async onModuleInit() {
    this.service = await new Discover().discover(config.TEMPLATE_SERVICE)
  }

  @All("templates*")
  async templateRoutes(@Req() request: FastifyRequest) {
    const fetchService = new Fetch(this.service, request)
    const data = await fetchService.fetch(config.TEMPLATE_SERVICE)

    return data
  }
}
