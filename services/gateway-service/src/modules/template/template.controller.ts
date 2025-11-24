import { All, Controller, Req } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { FastifyRequest } from "fastify"

import { Discover } from "../../common/discover"
import { Fetch } from "../../common/fetch"

@Controller()
export class TemplateController {
  private service: Service
  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.service = await new Discover().discover(
      this.config.get("TEMPLATE_SERVICE")!,
    )
  }

  @All("templates*")
  async templateRoutes(@Req() request: FastifyRequest) {
    const fetchService = new Fetch(this.service, request)
    const data = await fetchService.fetch("Template")

    return data
  }
}
