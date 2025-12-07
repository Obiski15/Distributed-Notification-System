import { config } from "@dns/shared/config/index"
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
    // Replace unreachable IPs with localhost
    const host = config.is_dev
      ? "localhost"
      : this.service.ServiceAddress || this.service.Address

    const target_url = `http://${host}:${this.service.ServicePort}${this.request.url}`

    // Clean headers to avoid conflicts
    const cleanHeaders = { ...this.request.headers }
    delete cleanHeaders["content-length"]
    delete cleanHeaders["host"]

    const res = await circuit_breaker<AxiosResponse>(
      () =>
        firstValueFrom(
          this.httpService.request({
            method: this.request.method,
            url: target_url,
            data: this.request.body,
            headers: cleanHeaders,
            params: this.request.query,
          }),
        ),
      service_name,
    ).fire()

    return res.data as Record<string, unknown>
  }
}
