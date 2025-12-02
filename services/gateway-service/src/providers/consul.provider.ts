import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common"
import { config } from "@shared/config/index"

import { CustomException } from "../common/exceptions/custom/custom-exceptions"

@Injectable()
export class ConsulProvider implements OnModuleInit, OnModuleDestroy {
  private service_id = `${config.GATEWAY_SERVICE}-${config.GATEWAY_SERVICE_PORT}`

  constructor(private readonly logger: Logger) {}

  async onModuleInit() {
    try {
      await this.registerService()
      this.logger.log(
        `✅ [${config.GATEWAY_SERVICE}] Registered with Consul at ${config.CONSUL_HOST}:${config.CONSUL_PORT}`,
      )
    } catch {
      throw new CustomException("❌ Fatal: Could not register with Consul", 500)
    }
  }

  async onModuleDestroy() {
    await this.deregisterService()
    this.logger.log(`[${config.GATEWAY_SERVICE}] Deregistered from Consul`)
  }

  public async registerService() {
    const body = {
      Name: config.GATEWAY_SERVICE,
      ID: `${config.GATEWAY_SERVICE}-${config.GATEWAY_SERVICE_PORT}`,
      Address: config.GATEWAY_SERVICE,
      Port: config.GATEWAY_SERVICE_PORT,
      Check: {
        HTTP: `http://${config.GATEWAY_SERVICE}:${config.GATEWAY_SERVICE_PORT}/health`,
        Interval: "10s",
      },
    }

    await fetch(
      `http://${config.CONSUL_HOST}:${config.CONSUL_PORT}/v1/agent/service/register`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    )
  }

  public async deregisterService() {
    await fetch(
      `http://${config.CONSUL_HOST}:${config.CONSUL_PORT}/v1/agent/service/deregister/${this.service_id}`,
      { method: "PUT" },
    )
  }
}
