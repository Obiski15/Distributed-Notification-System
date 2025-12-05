import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { config } from "@shared/config/index"
import * as ERROR_CODES from "@shared/constants/error-codes"
import * as STATUS_CODES from "@shared/constants/status-codes"
import * as SYSTEM_MESSAGES from "@shared/constants/system-message"
import logger from "@shared/utils/logger"
import { CustomException } from "../common/exceptions/custom/custom-exceptions"

@Injectable()
export class ConsulProvider implements OnModuleInit, OnModuleDestroy {
  private service_id = `${config.GATEWAY_SERVICE}-${config.GATEWAY_SERVICE_PORT}`

  async onModuleInit() {
    try {
      await this.register_service()
      logger.info(
        `✅ [${config.GATEWAY_SERVICE}] Registered with Consul at ${config.CONSUL_HOST}:${config.CONSUL_PORT}`,
      )
    } catch (error) {
      logger.error(error, "❌ Fatal: Could not register with Consul")
      throw new CustomException({
        message: SYSTEM_MESSAGES.SERVICE_UNAVAILABLE,
        status_code: STATUS_CODES.SERVICE_UNAVAILABLE,
        code: ERROR_CODES.SERVICE_UNAVAILABLE,
        details: "Could not register with Consul",
        is_operational: false,
      })
    }
  }

  async onModuleDestroy() {
    await this.deregister_service()
    logger.info(`[${config.GATEWAY_SERVICE}] Deregistered from Consul`)
  }

  public async register_service() {
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

  public async deregister_service() {
    await fetch(
      `http://${config.CONSUL_HOST}:${config.CONSUL_PORT}/v1/agent/service/deregister/${this.service_id}`,
      { method: "PUT" },
    )
  }
}
