import axios from "axios"
import { config } from "../config/index"
import type { Service } from "../types/index"
import circuit_breaker from "./circuit_breaker"

const discover_service = async (serviceName: string): Promise<Service> => {
  const breaker = circuit_breaker<Service>(async () => {
    const res = await axios.get(
      `http://${config.CONSUL_HOST}:${config.CONSUL_PORT}/v1/catalog/service/${serviceName}`,
    )

    if (res.status !== 200) {
      throw new Error(
        `Consul lookup failed for '${serviceName}': ${res.status} ${res.statusText}`,
      )
    }

    if (!res.data.length) {
      throw new Error(`Service '${serviceName}' not found in Consul.`)
    }

    return res.data[0] as Service
  }, serviceName)

  const service = breaker.fire()

  return service
}

export default discover_service
