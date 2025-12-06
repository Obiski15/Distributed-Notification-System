import logger from "./logger.js"

interface ConsulServiceConfig {
  service_name: string
  service_port: number
  consul_host: string
  consul_port: number
}

export async function register_consul_service(
  config: ConsulServiceConfig,
): Promise<void> {
  const service_id = `${config.service_name}-${config.service_port}`

  // Use host.docker.internal when Consul is on localhost (Docker can reach host), otherwise use service name
  const service_address =
    config.consul_host === "localhost" || config.consul_host === "127.0.0.1"
      ? "host.docker.internal"
      : config.service_name

  const body = {
    Name: config.service_name,
    ID: service_id,
    Address: service_address,
    Port: config.service_port,
    Check: {
      HTTP: `http://${service_address}:${config.service_port}/health`,
      Interval: "10s",
    },
  }

  await fetch(
    `http://${config.consul_host}:${config.consul_port}/v1/agent/service/register`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  )

  logger.info(
    `✅ [${config.service_name}] Registered with Consul at ${config.consul_host}:${config.consul_port}`,
  )
}

export async function deregister_consul_service(
  config: ConsulServiceConfig,
): Promise<void> {
  const service_id = `${config.service_name}-${config.service_port}`

  try {
    await fetch(
      `http://${config.consul_host}:${config.consul_port}/v1/agent/service/deregister/${service_id}`,
      { method: "PUT" },
    )
    logger.info(`✅ [${config.service_name}] Deregistered from Consul`)
  } catch (err) {
    logger.error(
      `❌ [${config.service_name}] Failed to deregister from Consul: ${err as Error}`,
    )
  }
}
