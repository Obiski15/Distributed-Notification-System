import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify"
import * as STATUS_CODES from "@shared/constants/status-codes"
import * as SYSTEM_MESSAGES from "@shared/constants/system-message"
import { setup_graceful_shutdown } from "@shared/utils/graceful-shutdown"
import logger from "@shared/utils/logger"
import { AppModule } from "./app.module"

// import { SwaggerGateway } from "./swagger/swaggerService"
import { config } from "@shared/config/index"

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  )

  app.enableCors({
    credentials: true,
    origin: (origin, cb) => {
      if (!origin) return cb(null, true)

      return cb(new Error(SYSTEM_MESSAGES.CORS_ORIGIN_NOT_ALLOWED), false)
    },
  })

  const instance = app.getHttpAdapter().getInstance()

  app.setGlobalPrefix("api/v1", {
    exclude: ["/health"],
  })

  instance.get("/health", (_req, reply) => {
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

  // Setup Swagger UI
  // const swaggerGateway = app.get(SwaggerGateway)
  // swaggerGateway.setup(app)

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
