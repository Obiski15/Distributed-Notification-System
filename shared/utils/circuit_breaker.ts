import CircuitBreaker from "opossum"

import { config } from "../config/index"
import logger from "./logger"

export const breaker_listeners = <T>(
  breaker: CircuitBreaker<[], T>,
  service: string,
) => {
  breaker.on("open", () => {
    logger.error(`Circuit OPEN - ${service} appears to be down`)
  })

  breaker.on("halfOpen", () => {
    logger.error(`Circuit HALF-OPEN - Testing ${service}`)
  })

  breaker.on("close", () => {
    logger.info(`Circuit CLOSED - ${service} restored`)
  })
}

const circuit_breaker = <T>(operation: () => Promise<T>, service: string) => {
  const breaker = new CircuitBreaker(operation, config.BREAKER_OPTIONS)

  // Add listeners for circuit state changes
  breaker_listeners<T>(breaker, service)

  return breaker
}

export default circuit_breaker
