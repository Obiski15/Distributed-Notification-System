import app from "../../app.js"

const discover_service = async (
  serviceName: string,
  path: string,
  options?: Record<string, unknown>,
): Promise<Record<string, unknown>> => {
  try {
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
    const template_service = services[0]
    const templateUrl = `http://${
      template_service.ServiceAddress || template_service.Address
    }:${template_service.ServicePort}/${path}`
    const templateRes = await fetch(templateUrl, options)
    if (!templateRes.ok) {
      throw new Error(
        `Request to '${templateUrl}' failed: ${templateRes.status} ${templateRes.statusText}`,
      )
    }
    const data = await templateRes.json()
    console.log("discovered service data :", data)
    return data
  } catch (err: any) {
    throw new Error(`discover_service error: ${err.message}`)
  }
}

export default discover_service
