import { Logger } from "@nestjs/common"
import * as CircuitBreaker from "opossum"

const options = {
  failureThreshold: 50, // Open after 50% of requests fail
  resetTimeout: 10000, // Try again after 10 seconds
  timeout: 8080, // Time before request is considered failed
  errorThresholdPercentage: 50, // Error percentage to open circuit,
}

export class Breaker<T> {
  private logger: Logger
  public breaker: CircuitBreaker<[], T>

  constructor(cb: () => Promise<T>, service: string) {
    this.logger = new Logger("Circuit Breaker")

    this.breaker = new CircuitBreaker(cb, options)

    // this.breaker
    this.breaker.on("open", () => {
      this.logger.error(`Circuit OPEN - ${service} service appears to be down`)
    })

    this.breaker.on("halfOpen", () => {
      this.logger.warn(`Circuit HALF-OPEN - Testing ${service} service`)
    })

    this.breaker.on("close", () => {
      this.logger.log(`Circuit CLOSED - ${service} service restored`)
    })
  }

  async fire() {
    const fired: Promise<T> = await this.breaker.fire()

    return fired
  }
}
