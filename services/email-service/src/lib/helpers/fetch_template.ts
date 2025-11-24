import circuit_breaker from "../utils/circuit_breaker.js"
import fetch_service from "../utils/fetch_service.js"

export const fetch_template = async (template_code: string) => {
  const template = circuit_breaker<{ body: string; subject: string }>(
    async () =>
      await fetch_service(
        "template-service",
        `api/v1/templates/${template_code}`,
      ),
    "Template",
  ).fire()

  return template
}
