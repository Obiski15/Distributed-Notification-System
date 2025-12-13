import { config } from "@dns/shared/config/index"
import * as STATUS_CODES from "@dns/shared/constants/status-codes"
import * as SYSTEM_MESSAGES from "@dns/shared/constants/system-message"
import health_schema from "@dns/shared/schemas/health-schema"
import { setup_graceful_shutdown } from "@dns/shared/utils/graceful-shutdown"
import logger from "@dns/shared/utils/logger"
import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify"
import helmet from "helmet"
import { AppModule } from "./app.module"

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )

  app.use(helmet())

  app.enableCors({
    credentials: true,
    origin: (origin, cb) => {
      if (!origin || config.ALLOWED_ORIGINS.includes(origin))
        return cb(null, true)

      return cb(new Error(SYSTEM_MESSAGES.CORS_ORIGIN_NOT_ALLOWED), false)
    },
  })

  const instance = app.getHttpAdapter().getInstance()

  app.setGlobalPrefix("api/v1", {
    exclude: ["/health"],
  })

  instance.get("/health", { schema: health_schema }, (_req, reply) => {
    reply.send({
      success: true,
      status_code: STATUS_CODES.OK,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    })
  })

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  )

  // Setup unified Swagger Documentation
  const { SwaggerGateway } = await import("./swagger/swaggerService")
  const swaggerGateway = app.get(SwaggerGateway)
  swaggerGateway.setup(app)

  await app.listen(config.GATEWAY_SERVICE_PORT, config.HOST)
  logger.info(`API Gateway listening on PORT ${config.GATEWAY_SERVICE_PORT}`)

  // Setup graceful shutdown
  setup_graceful_shutdown([
    {
      cleanup: async () => {
        await app.close()
      },
      timeout: 15000,
    },
  ])
}

void bootstrap()
