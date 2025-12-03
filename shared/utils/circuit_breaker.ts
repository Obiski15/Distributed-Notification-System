import CircuitBreaker from "opossum"

import { config } from "../config/index"

export const breaker_listeners = <T>(
  breaker: CircuitBreaker<[], T>,
  service: string,
) => {
  breaker.on("open", () => {
    console.log(`Circuit OPEN - ${service} appears to be down`)
  })

  breaker.on("halfOpen", () => {
    console.log(`Circuit HALF-OPEN - Testing ${service}`)
  })

  breaker.on("close", () => {
    console.log(`Circuit CLOSED - ${service} restored`)
  })
}

const circuit_breaker = <T>(operation: () => Promise<T>, service: string) => {
  const breaker = new CircuitBreaker(operation, config.BREAKER_OPTIONS)

  // Add listeners for circuit state changes
  breaker_listeners<T>(breaker, service)

  return breaker
}

export default circuit_breaker
