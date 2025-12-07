import axios from "axios"
import { config as config_vars } from "../config/index.js"
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

  // Use service name when not on localhost
  const service_address = config_vars.is_dev ? "localhost" : config.service_name

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

  await axios.put(
    `http://${config.consul_host}:${config.consul_port}/v1/agent/service/register`,
    body,
    {
      headers: {
        "Content-Type": "application/json",
      },
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
    await axios.put(
      `http://${config.consul_host}:${config.consul_port}/v1/agent/service/deregister/${service_id}`,
    )
    logger.info(`✅ [${config.service_name}] Deregistered from Consul`)
  } catch (err) {
    logger.error(
      `❌ [${config.service_name}] Failed to deregister from Consul: ${err as Error}`,
    )
  }
}
