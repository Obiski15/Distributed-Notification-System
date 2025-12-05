import { ValidationPipe } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify"
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

      return cb(new Error("Origin not allowed by CORS"), false)
    },
  })

  const instance = app.getHttpAdapter().getInstance()

  app.setGlobalPrefix("api/v1", {
    exclude: ["/health"],
  })

  instance.get("/health", (_req, reply) => {
    reply.send({
      success: true,
      status_code: 200,
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

  const gracefulShutdown = async (signal: string) => {
    logger.info(`\n🛑 Received ${signal}, shutting down gracefully...`)
    await app.close()
    process.exit(0)
  }

  process.on("SIGINT", () => {
    gracefulShutdown("SIGINT").catch(err => {
      logger.error(`Error during graceful shutdown (SIGINT): ${err}`)
      process.exit(1)
    })
  })
  process.on("SIGTERM", () => {
    gracefulShutdown("SIGTERM").catch(err => {
      logger.error(`Error during graceful shutdown (SIGTERM): ${err}`)
      process.exit(1)
    })
  })

  await app.listen(config.GATEWAY_SERVICE_PORT, config.HOST)
  logger.info(`API Gateway listening on PORT ${config.GATEWAY_SERVICE_PORT}`)
}

bootstrap()
