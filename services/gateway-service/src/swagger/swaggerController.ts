import { Controller, Get } from "@nestjs/common"
import { SwaggerGateway } from "./swaggerService"

@Controller("swagger")
export class SwaggerController {
  constructor(private readonly swaggerGateway: SwaggerGateway) {}

  @Get("health")
  health() {
    return {
      success: true,
      message: "Swagger Gateway is up and running",
      data: { cached: !!this.swaggerGateway["cachedSpec"] },
    }
  }
}
