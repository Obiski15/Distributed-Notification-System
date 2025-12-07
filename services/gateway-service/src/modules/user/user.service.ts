import { config } from "@dns/shared/config/index"
import discover_service from "@dns/shared/utils/discover_service"
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager"
import { Inject, Injectable } from "@nestjs/common"
import type { FastifyRequest } from "fastify"
import { Fetch } from "../../common/fetch"

@Injectable()
export class UserService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async get_user(id: string) {
    const service = await discover_service(config.USER_SERVICE)

    const cache_key = `user:${id}`

    const cached_status = (await this.cache.get(cache_key)) as IUser

    if (cached_status !== undefined && cached_status !== null) {
      return cached_status
    }

    // Create a mock request for the Fetch class
    const mockRequest = {
      url: "/api/v1/users",
      method: "GET",
      headers: {
        "x-user-id": id,
      },
      body: undefined,
      query: {},
    } as unknown as FastifyRequest

    const fetch = new Fetch(service, mockRequest)
    const data = (await fetch.fetch_service(config.USER_SERVICE)) as {
      data: IUser
    }

    await this.cache.set(cache_key, data.data, 3000)

    return data.data
  }
}
