import { config as config_vars } from "@dns/shared/config/index"
import discover_service from "@dns/shared/utils/discover_service"
import logger from "@dns/shared/utils/logger"
import { Cache, CACHE_MANAGER } from "@nestjs/cache-manager"
import { INestApplication, Inject, Injectable } from "@nestjs/common"
import { HttpAdapterHost } from "@nestjs/core"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"
import { FastifyReply, FastifyRequest } from "fastify"
import merge from "lodash.merge"
import { Fetch } from "../common/fetch"

@Injectable()
export class SwaggerGateway {
  private readonly CACHE_KEY = "swagger:merged-spec"
  private readonly CACHE_TTL_MS = 60 * 1000

  constructor(
    @Inject(CACHE_MANAGER) private cache: Cache,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  setup(app: INestApplication) {
    const fastifyApp = this.adapterHost.httpAdapter.getInstance()

    // Build gateway's own Swagger configuration
    const swaggerConfig = new DocumentBuilder()
      .setTitle("DNS API Gateway")
      .setDescription(
        "Distributed Notification System - Complete API documentation for Gateway and all microservices",
      )
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth",
      )
      .addTag("Notifications", "Send and manage notifications")
      .build()

    // Generate gateway's document
    const gatewayDocument = SwaggerModule.createDocument(app, swaggerConfig)

    // Endpoint to serve merged Swagger JSON dynamically
    fastifyApp.get(
      "/docs/json",
      async (_request: FastifyRequest, reply: FastifyReply) => {
        try {
          // Check Redis cache first
          const cachedSpec = await this.cache.get<Record<string, any>>(
            this.CACHE_KEY,
          )

          if (cachedSpec) {
            logger.info("📦 Serving Swagger spec from Redis cache")
            reply.send(cachedSpec)
            return
          }

          logger.info("🔄 Fetching fresh Swagger specs from microservices")

          // Only fetch docs from services that have HTTP APIs
          const serviceConfigs = [
            {
              name: config_vars.TEMPLATE_SERVICE,
              port: config_vars.TEMPLATE_SERVICE_PORT,
            },
            {
              name: config_vars.USER_SERVICE,
              port: config_vars.USER_SERVICE_PORT,
            },
          ]

          // Fetch Swagger specs
          const specs = await Promise.all(
            serviceConfigs.map(async ({ name }) => {
              try {
                const service = await discover_service(name)
                const mockRequest = {
                  url: "/docs/json",
                  method: "GET",
                  body: undefined,
                  headers: {},
                  query: {},
                } as FastifyRequest

                const fetch = new Fetch(service, mockRequest)
                const data = await fetch.fetch_service(name)
                logger.info(`✅ Fetched Swagger from ${name}`)
                return data as Record<string, any>
              } catch (err) {
                const error = err as Error
                logger.warn(
                  `⚠️ Could not fetch Swagger from ${name}: ${error.message}`,
                )
                // Skip this service silently
                return {}
              }
            }),
          )

          // Merge the Swagger specs including gateway's own document
          const mergedSpec = [gatewayDocument, ...specs].reduce(
            (acc, spec) => merge(acc, spec) as Record<string, any>,
            {
              openapi: "3.0.3",
              info: {
                title: "DNS Unified API Documentation",
                version: "1.0.0",
                description:
                  "Complete API documentation for DNS Gateway and all microservices",
              },
              paths: {},
              components: {},
            } as Record<string, any>,
          )

          // Override servers to use gateway URL instead of individual service URLs
          mergedSpec.servers = [
            {
              url: `http://localhost:${config_vars.GATEWAY_SERVICE_PORT}`,
              description: "Gateway Server",
            },
          ]

          // Cache in Redis with TTL
          await this.cache.set(this.CACHE_KEY, mergedSpec, this.CACHE_TTL_MS)
          logger.info("💾 Cached merged Swagger spec in Redis")

          reply.send(mergedSpec)
        } catch (err) {
          const error = err as Error
          logger.error(`💥 Failed to merge Swagger specs: ${error.message}`)
          reply.status(500).send({ error: "Failed to merge Swagger specs" })
        }
      },
    )

    // Setup Swagger UI to load spec from URL instead of inline
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    SwaggerModule.setup("docs", app, null as any, {
      customSiteTitle: "DNS API Documentation",
      customCss: ".swagger-ui .topbar { display: none }",
      swaggerOptions: {
        url: "/docs/json", // Points to merged JSON
        persistAuthorization: true,
        docExpansion: "list",
        filter: true,
        showRequestDuration: true,
        explorer: true,
      },
    })
  }
}
