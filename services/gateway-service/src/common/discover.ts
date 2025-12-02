import { HttpService } from "@nestjs/axios"
import { HttpStatus } from "@nestjs/common"
import { config } from "@shared/config/index"
import { AxiosResponse } from "axios"
import { firstValueFrom } from "rxjs"
import { Breaker } from "./breaker"

export class Discover {
  private httpService: HttpService

  constructor() {
    this.httpService = new HttpService()
  }

  async discover(name: string): Promise<Service> {
    const res = await new Breaker<AxiosResponse>(
      () =>
        firstValueFrom(
          this.httpService.request({
            url: `http://${config.CONSUL_HOST}:${config.CONSUL_PORT}/v1/catalog/service/${name}`,
          }),
        ),
      "Consul",
    ).fire()

    if (res.status !== (HttpStatus.OK as number)) {
      throw new Error(
        `Consul lookup failed for service '${name}': ${res.status} ${res.statusText}`,
      )
    }

    if (!res.data.length) {
      throw new Error(`Service '${name}' not found in Consul.`)
    }

    return res.data[0] as Service
  }
}
