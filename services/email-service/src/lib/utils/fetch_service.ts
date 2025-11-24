import discover_service from "../utils/discover_service.js"

const fetch_service = async (
  name: string,
  path: string,
  options: Record<string, unknown> = {},
) => {
  const service = await discover_service(name)

  const url = `http://${
    service.ServiceAddress || service.Address
  }:${service.ServicePort}/${path}`

  const serviceRes = await fetch(url, options)

  if (!serviceRes.ok) {
    throw new Error(
      `Request to '${url}' failed: ${serviceRes.status} ${serviceRes.statusText}`,
    )
  }

  const data = await serviceRes.json()

  return data.data
}

export default fetch_service
