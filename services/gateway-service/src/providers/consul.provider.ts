import { config } from "@dns/shared/config/index"
import * as ERROR_CODES from "@dns/shared/constants/error-codes"
import * as STATUS_CODES from "@dns/shared/constants/status-codes"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import {
  deregister_consul_service,
  register_consul_service,
} from "@dns/shared/utils/consul"
import logger from "@dns/shared/utils/logger"
import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common"
import { CustomException } from "../common/exceptions/custom/custom-exceptions"

@Injectable()
export class ConsulProvider implements OnModuleInit, OnModuleDestroy {
  private consul_config = {
    service_name: config.GATEWAY_SERVICE,
    service_port: config.GATEWAY_SERVICE_PORT,
    consul_host: config.CONSUL_HOST,
    consul_port: config.CONSUL_PORT,
  }

  async onModuleInit() {
    try {
      await register_consul_service(this.consul_config)
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
    await deregister_consul_service(this.consul_config)
  }
}
