const error_response_schema = {
  type: "object",
  properties: {
    success: { type: "boolean", default: false },
    message: { type: "string" },
    status_code: { type: "number" },
    error_code: { type: "string" },
    details: {},
    timestamp: { type: "string" },
    path: { type: "string" },
    request_id: { type: "string" },
    stack: { type: "string" },
  },
}

export default error_response_schema
