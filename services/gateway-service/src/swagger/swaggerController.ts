import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager"
import { Controller, Get, Inject } from "@nestjs/common"

@Controller("swagger")
export class SwaggerController {
  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  @Get("health")
  async health() {
    const cached = await this.cache.get("swagger:merged-spec")
    return {
      success: true,
      message: "Swagger Gateway is up and running",
      data: { cached: !!cached },
    }
  }
}
