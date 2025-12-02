import { config } from "@shared/config/index.js"

interface Service {
  Address: string
  ServiceAddress: string
  ServicePort: number
  ServiceID: string
  ServiceName: string
  ServiceTags: string[]
}

const discover_service = async (serviceName: string): Promise<Service> => {
  const res = await fetch(
    `http://${config.CONSUL_HOST}:${config.CONSUL_PORT}/v1/catalog/service/${serviceName}`,
  )
  if (!res.ok) {
    throw new Error(
      `Consul lookup failed for service '${serviceName}': ${res.status} ${res.statusText}`,
    )
  }
  const services = (await res.json()) as Service[]

  if (!services.length) {
    throw new Error(`Service '${serviceName}' not found in Consul.`)
  }

  return services[0]
}

export default discover_service
