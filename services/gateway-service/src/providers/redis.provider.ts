import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common"
import { ConfigService } from "@nestjs/config"
import Redis from "ioredis"

@Injectable()
export class RedisProvider implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisProvider.name)
  public redis: Redis

  constructor(private readonly config: ConfigService) {
    this.redis = new Redis({
      host: this.config.get<string>("REDIS_HOST"),
      port: this.config.get<number>("REDIS_PORT"),
      retryStrategy: times => Math.min(times * 50, 2000),
      lazyConnect: true,
    })
  }

  async onModuleInit() {
    try {
      this.redis.on("connect", () => this.logger.log("Redis Connected"))
      this.redis.on("error", err =>
        this.logger.error(`Redis Error: ${err.message}`),
      )

      await this.redis.connect() // force connection on startup
      this.logger.log("✅ Redis connection established")
    } catch (error) {
      this.logger.error("❌ Fatal: Could not connect to Redis")
      throw error
    }
  }

  onModuleDestroy() {
    this.redis.disconnect()
    this.logger.log("Disconnected from Redis")
  }
}
