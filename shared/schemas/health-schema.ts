import error_response_schema from "./error-response-schema.js"

const health_schema = {
  description: "Check if the service is healthy.",
  tags: ["Health"],
  response: {
    200: {
      type: "object",
      properties: {
        success: { type: "boolean" },
        message: { type: "string", example: "ok" },
        status_code: { type: "number", example: 200 },
        timestamp: { type: "string" },
        uptime: { type: "number" },
      },
    },
    500: error_response_schema,
  },
}

export default health_schema
