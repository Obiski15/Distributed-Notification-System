import { INestApplication, Injectable, Logger } from "@nestjs/common"
import { HttpService } from "@nestjs/axios"
import { lastValueFrom } from "rxjs"
import merge from "lodash.merge"
import { FastifyInstance } from "fastify"
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger"
import * as CircuitBreaker from "opossum"
import { ConsulService } from "../consul/consul.service"

interface MicroserviceSpec {
  name: string
  url: string
}

@Injectable()
export class SwaggerGateway {
  private readonly logger = new Logger(SwaggerGateway.name)
  private cachedSpec: any = null
  private lastFetched: number = 0
  private cacheTtl = 60 * 1000 // 1 minute cache
  private breaker: CircuitBreaker<[string], any>

  constructor(
    private readonly httpService: HttpService,
    private readonly consulService: ConsulService,
  ) {
    // Circuit breaker setup
    const options = {
      timeout: 4000, // 4s per Swagger fetch
      errorThresholdPercentage: 50, // Trip after 50% errors
      resetTimeout: 10000, // Retry after 10s
    }

    this.breaker = new CircuitBreaker(this.fetchSwaggerDoc.bind(this), options)

    this.breaker.on("open", () =>
      this.logger.warn("⚠️ Swagger circuit breaker OPENED (services failing)"),
    )
    this.breaker.on("halfOpen", () =>
      this.logger.log("🟡 Swagger circuit breaker HALF-OPEN (retrying...)"),
    )
    this.breaker.on("close", () =>
      this.logger.log("✅ Swagger circuit breaker CLOSED (recovered)"),
    )
  }

  async setup(app: INestApplication) {
    const fastifyApp = app.getHttpAdapter().getInstance() as FastifyInstance

    // Endpoint to serve merged Swagger JSON dynamically
    fastifyApp.get("/swagger/api-docs.json", async (request, reply) => {
      try {
        const now = Date.now()

        // Return cached spec if still valid
        if (this.cachedSpec && now - this.lastFetched < this.cacheTtl) {
          return reply.send(this.cachedSpec)
        }

        const serviceNames = [
          "email-service",
          "push-service",
          "template-service",
          "user-service",
        ]
        const MICROSERVICES: MicroserviceSpec[] = []

        // Discover services dynamically via Consul
        for (const name of serviceNames) {
          try {
            const serviceUrl = await this.consulService.getServiceAddress(name)
            if (!serviceUrl) {
              this.logger.warn(`⚠️ ${name} not found in Consul`)
              continue
            }

            let path = "/docs/json"
            if (name === "user-service") path = "/api-docs/openapi.json" // user-service special case

            MICROSERVICES.push({ name, url: `${serviceUrl}${path}` })
          } catch (err) {
            this.logger.warn(`Failed to resolve ${name}: ${err.message}`)
          }
        }

        // Fetch Swagger specs using circuit breaker
        const specs = await Promise.all(
          MICROSERVICES.map(async svc => {
            try {
              return await this.breaker.fire(svc.url)
            } catch (err) {
              this.logger.warn(
                `❌ Circuit breaker skip: ${svc.name} (${err.message})`,
              )
              return {} // skip this one
            }
          }),
        )

        // Merge the Swagger specs
        const mergedSpec = specs.reduce((acc, spec) => merge(acc, spec), {
          openapi: "3.0.3",
          info: {
            title: "Unified API Gateway",
            version: "1.0.0",
            description: "Aggregated API documentation for all microservices",
          },
          paths: {},
          components: {},
        })

        // Cache the merged result
        this.cachedSpec = mergedSpec
        this.lastFetched = now

        reply.send(mergedSpec)
      } catch (err) {
        this.logger.error("💥 Failed to merge Swagger specs", err)
        reply.status(500).send({ error: "Failed to merge Swagger specs" })
      }
    })

    // Serve Swagger UI via NestJS + Fastify
    const config = new DocumentBuilder()
      .setTitle("Unified API Gateway")
      .setDescription("Aggregated API documentation for all microservices")
      .setVersion("1.0.0")
      .build()

    const document = SwaggerModule.createDocument(app, config)

    SwaggerModule.setup("swagger", app, document, {
      swaggerOptions: {
        url: "/swagger/api-docs.json", // Points to merged JSON
        explorer: true,
      },
    })
  }

  // Called by the circuit breaker
  private async fetchSwaggerDoc(serviceUrl: string) {
    const res = await lastValueFrom(
      this.httpService.get(serviceUrl, { timeout: 4000 }),
    )
    return res.data
  }
}
