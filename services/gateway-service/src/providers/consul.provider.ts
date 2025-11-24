import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"

@Injectable()
export class ConsulProvider implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConsulProvider.name)
  private readonly CONSUL_HOST: string
  private readonly CONSUL_PORT: number
  private readonly SERVICE_NAME: string
  private readonly PORT: number

  constructor(private readonly config: ConfigService) {
    this.CONSUL_HOST = this.config.get<string>("CONSUL_HOST")!
    this.SERVICE_NAME = this.config.get("SERVICE_NAME")!
    this.CONSUL_PORT = +this.config.get("CONSUL_PORT")
    this.PORT = +this.config.get("PORT")
  }

  async onModuleInit() {
    try {
      await this.registerService()
      this.logger.log(
        `✅ [${this.SERVICE_NAME}] Registered with Consul at ${this.CONSUL_HOST}:${this.CONSUL_PORT}`,
      )
    } catch (error) {
      this.logger.error("❌ Fatal: Could not register with Consul")
      throw error
    }
  }

  async onModuleDestroy() {
    await this.deregisterService()
    this.logger.log(`[${this.SERVICE_NAME}] Deregistered from Consul`)
  }

  public async registerService() {
    const body = {
      Name: this.SERVICE_NAME,
      ID: `${this.SERVICE_NAME}-${this.PORT}`,
      Address: this.SERVICE_NAME,
      Port: Number(this.PORT),
      Check: {
        HTTP: `http://${this.SERVICE_NAME}:${this.PORT}/api/v1/health`,
        Interval: "10s",
      },
    }

    await fetch(
      `http://${this.CONSUL_HOST}:${this.CONSUL_PORT}/v1/agent/service/register`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    )
  }

  public async deregisterService() {
    const serviceId = `${this.SERVICE_NAME}-${this.PORT}`

    await fetch(
      `http://${this.CONSUL_HOST}:${this.CONSUL_PORT}/v1/agent/service/deregister/${serviceId}`,
      { method: "PUT" },
    )
  }

  // Get the base URL for a single service
  async getServiceAddress(serviceName: string): Promise<string | null> {
    try {
      const res = await fetch(
        `http://${this.CONSUL_HOST}:${this.CONSUL_PORT}/v1/catalog/service/${serviceName}`,
      )
      const data = (await res.json()) as any[]
      if (!data || data.length === 0) {
        this.logger.warn(`Service [${serviceName}] not found in Consul`)
        return null
      }
      const service = data[0]
      return `http://${service.ServiceAddress}:${service.ServicePort}`
    } catch (err) {
      this.logger.error("Consul query failed:", err)
      return null
    }
  }

  async getAllServices(): Promise<Record<string, string>> {
    try {
      const res = await fetch(
        `http://${this.CONSUL_HOST}:${this.CONSUL_PORT}/v1/catalog/services`,
      )
      const services = (await res.json()) as Record<string, string[]>
      const result: Record<string, string> = {}
      for (const name of Object.keys(services)) {
        const address = await this.getServiceAddress(name)
        if (address) result[name] = address
      }
      return result
    } catch (err) {
      this.logger.error("Failed to fetch all services from Consul:", err)
      return {}
    }
  }
}
