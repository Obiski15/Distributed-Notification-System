import app from "../../app.js"

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
    `http://${app.config.CONSUL_HOST}:${app.config.CONSUL_PORT}/v1/catalog/service/${serviceName}`,
  )
  if (!res.ok) {
    throw new Error(
      `Consul lookup failed for service '${serviceName}': ${res.status} ${res.statusText}`,
    )
  }
  const services = await res.json()

  if (!services.length) {
    throw new Error(`Service '${serviceName}' not found in Consul.`)
  }

  return services[0] as Service
}

export default discover_service
