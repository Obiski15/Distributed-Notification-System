import circuit_breaker from "@shared/utils/circuit_breaker"
import CircuitBreaker from "opossum"

export class Breaker<T> {
  public breaker: CircuitBreaker<[], T>

  constructor(cb: () => Promise<T>, service: string) {
    this.breaker = circuit_breaker(cb, service)
  }

  async fire(): Promise<T> {
    const fired = await this.breaker.fire()

    return fired
  }
}
