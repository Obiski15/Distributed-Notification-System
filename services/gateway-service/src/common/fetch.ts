import type { Service } from "@dns/shared/types/index"
import circuit_breaker from "@dns/shared/utils/circuit_breaker"
import { HttpService } from "@nestjs/axios"
import { Injectable } from "@nestjs/common"
import { AxiosResponse } from "axios"
import { FastifyRequest } from "fastify"
import { firstValueFrom } from "rxjs"

@Injectable()
export class Fetch {
  private service: Service
  private request: FastifyRequest
  private httpService: HttpService

  constructor(service: Service, request: FastifyRequest) {
    this.httpService = new HttpService()
    this.service = service
    this.request = request
  }

  async fetch_service(service_name: string) {
    const target_url = `http://${
      this.service.ServiceAddress || this.service.Address
    }:${this.service.ServicePort}${this.request.url}`

    const res = await circuit_breaker<AxiosResponse>(
      () =>
        firstValueFrom(
          this.httpService.request({
            method: this.request.method,
            url: target_url,
            data: this.request.body,
            headers: this.request.headers,
            params: this.request.query,
          }),
        ),
      service_name,
    ).fire()

    return res.data as Record<string, unknown>
  }
}
