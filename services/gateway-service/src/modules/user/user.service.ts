import { config } from "@dns/shared/config/index"
import type { Service } from "@dns/shared/types/index"
import circuit_breaker from "@dns/shared/utils/circuit_breaker"
import discover_service from "@dns/shared/utils/discover_service"
import { HttpService } from "@nestjs/axios"
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager"
import { Inject, Injectable, OnModuleInit } from "@nestjs/common"
import { AxiosResponse } from "axios"
import { firstValueFrom } from "rxjs"
@Injectable()
export class UserService implements OnModuleInit {
  private service: Service

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit() {
    this.service = await discover_service(config.USER_SERVICE)
  }

  async get_user(id: string) {
    const cache_key = `user:${id}`

    const cached_status = (await this.cache.get(cache_key)) as IUser

    if (cached_status !== undefined && cached_status !== null) {
      return cached_status
    }

    const target_url = `http://${
      this.service.ServiceAddress || this.service.Address
    }:${this.service.ServicePort}/api/v1/users`

    const res = await circuit_breaker<AxiosResponse<{ data: IUser }>>(
      () =>
        firstValueFrom(
          this.httpService.request({
            url: target_url,
            method: "GET",
            headers: {
              "x-user-id": id,
            },
          }),
        ),
      config.USER_SERVICE,
    ).fire()

    await this.cache.set(cache_key, res.data.data, 3000)

    return res.data.data
  }
}
