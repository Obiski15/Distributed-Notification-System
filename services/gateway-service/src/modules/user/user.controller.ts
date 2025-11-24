import { All, Controller, OnModuleInit, Req } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { FastifyRequest } from "fastify"

import { Discover } from "../../common/discover"
import { Fetch } from "../../common/fetch"

@Controller()
export class UserController implements OnModuleInit {
  private service: Service
  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    this.service = await new Discover().discover(
      this.config.get("USER_SERVICE")!,
    )
  }

  @All("users*")
  async userRoutes(@Req() request: FastifyRequest) {
    const fetchService = new Fetch(this.service, request)
    const data = await fetchService.fetch("User")
    console.log(data)
  }
}
