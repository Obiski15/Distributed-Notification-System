import discover_service from "./discover_service.js"

const fetch_template = async (
  template_code: string,
): Promise<{ body: string; subject: string }> => {
  const data = await discover_service(
    "template-service",
    `api/v1/templates/${template_code}`,
  )
  return data.data as { body: string; subject: string }
}

export default fetch_template
