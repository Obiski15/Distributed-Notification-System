import { HttpService } from "@nestjs/axios"
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager"
import { Inject, Injectable, OnModuleInit } from "@nestjs/common"
import { config } from "@shared/config/index"
import { AxiosResponse } from "axios"
import { firstValueFrom } from "rxjs"
import { Breaker } from "../../common/breaker"
import { Discover } from "../../common/discover"

@Injectable()
export class UserService implements OnModuleInit {
  private service: Service

  constructor(
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
    private readonly httpService: HttpService,
  ) {}

  async onModuleInit() {
    this.service = await new Discover().discover(config.USER_SERVICE)
  }

  async get_user(id: string) {
    const cacheKey = `user:${id}`

    const cachedStatus = (await this.cache.get(cacheKey)) as IUser

    if (cachedStatus !== undefined && cachedStatus !== null) {
      return cachedStatus
    }

    const targetUrl = `http://${
      this.service.ServiceAddress || this.service.Address
    }:${this.service.ServicePort}/api/v1/users`

    const res = await new Breaker<AxiosResponse<{ data: IUser }>>(
      () =>
        firstValueFrom(
          this.httpService.request({
            url: targetUrl,
            method: "GET",
            headers: {
              "x-user-id": id,
            },
          }),
        ),
      config.USER_SERVICE,
    ).fire()

    await this.cache.set(cacheKey, res.data.data, 3000)

    return res.data.data
  }
}
