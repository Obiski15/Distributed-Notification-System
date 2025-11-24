import { HttpService } from "@nestjs/axios"
import { Injectable } from "@nestjs/common"
import { AxiosResponse } from "axios"
import { FastifyRequest } from "fastify"
import { firstValueFrom } from "rxjs"
import { Breaker } from "./breaker"

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

  async fetch(serviceName: string) {
    const targetUrl = `http://${
      this.service.ServiceAddress || this.service.Address
    }:${this.service.ServicePort}${this.request.url}`

    const res = await new Breaker<AxiosResponse>(
      () =>
        firstValueFrom(
          this.httpService.request({
            method: this.request.method,
            url: targetUrl,
            data: this.request.body,
            headers: this.request.headers,
            params: this.request.query,
          }),
        ),
      serviceName,
    ).fire()

    return res.data as Record<string, unknown>
  }
}
