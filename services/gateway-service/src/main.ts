import { ValidationPipe } from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import { NestFactory } from "@nestjs/core"
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify"
import { AppModule } from "./app.module"
// import { SwaggerGateway } from "./swagger/swaggerService"

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
      message: "Gateway service healthy",
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
    console.log(`\n🛑 Received ${signal}, shutting down gracefully...`)
    await app.close()
    process.exit(0)
  }

  process.on("SIGINT", () => {
    gracefulShutdown("SIGINT").catch(err => {
      console.error("Error during graceful shutdown (SIGINT):", err)
      process.exit(1)
    })
  })
  process.on("SIGTERM", () => {
    gracefulShutdown("SIGTERM").catch(err => {
      console.error("Error during graceful shutdown (SIGTERM):", err)
      process.exit(1)
    })
  })

  const PORT = app.get(ConfigService).get("PORT") as number

  await app.listen(PORT, "0.0.0.0")
  console.log(`API Gateway listening on PORT ${PORT}`)
}

bootstrap()
