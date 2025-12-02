const error_response_schema = {
  type: "object",
  properties: {
    success: { type: "boolean", default: false },
    message: { type: "string" },
    status_code: { type: "number" },
  },
}

export default error_response_schema
