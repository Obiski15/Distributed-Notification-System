import base_response from "@dns/shared/schemas/base-response"
import error_response_schema from "@dns/shared/schemas/error-response-schema"

const shared_template_properties = {
  id: { type: "string", format: "uuid" },
  name: { type: "string" },
  type: { type: "string", enum: ["EMAIL", "PUSH"] },
  subject: { type: ["string", "null"] },
  body: { type: ["string", "null"] },
  image_url: { type: ["string", "null"] },
  action_url: { type: ["string", "null"] },
  metadata: { type: ["object", "null"], additionalProperties: true },
  version: { type: "number" },
  created_at: { type: "string" },
  updated_at: { type: "string" },
}

export const templates_schema = {
  description: "Get all templates",
  tags: ["Templates"],
  response: {
    200: {
      type: "object",
      properties: {
        ...base_response,
        data: {
          type: "object",
          properties: {
            templates: {
              type: "array",
              items: {
                type: "object",
                properties: shared_template_properties,
              },
            },
            meta: {
              type: "object",
              properties: {
                total: { type: "number" },
              },
            },
          },
        },
      },
    },
    500: error_response_schema,
  },
}

export const template_schema = {
  description: "Get template by code or ID",
  tags: ["Templates"],
  params: {
    type: "object",
    required: ["template_code"],
    properties: { template_code: { type: "string" } },
  },
  response: {
    200: {
      type: "object",
      properties: {
        ...base_response,
        data: {
          type: "object",
          properties: shared_template_properties,
        },
      },
    },
    404: error_response_schema,
    500: error_response_schema,
  },
}

export const create_template_schema = {
  description: "Create a new template",
  tags: ["Templates"],
  body: {
    type: "object",
    required: ["name", "subject", "body", "type"],
    properties: {
      name: { type: "string" },
      type: { type: "string", enum: ["EMAIL", "PUSH"] },
      subject: { type: "string" },
      body: { type: "string" },
      image_url: { type: "string" },
      action_url: { type: "string" },
      metadata: { type: "object", additionalProperties: true },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        ...base_response,
        data: {
          type: "object",
          properties: shared_template_properties,
        },
      },
    },
    500: error_response_schema,
  },
}

export const update_template_schema = {
  description: "Update template",
  tags: ["Templates"],
  params: {
    type: "object",
    required: ["template_id"],
    properties: { template_id: { type: "string" } },
  },
  body: {
    type: "object",
    properties: {
      name: { type: "string" },
      subject: { type: "string" },
      body: { type: "string" },
      image_url: { type: "string" },
      action_url: { type: "string" },
      metadata: { type: "object", additionalProperties: true },
      type: { type: "string", enum: ["EMAIL", "PUSH"] },
    },
    additionalProperties: false,
  },
  response: {
    200: {
      type: "object",
      properties: {
        ...base_response,
        data: {
          type: "object",
          properties: shared_template_properties,
        },
      },
    },
    404: error_response_schema,
    500: error_response_schema,
  },
}

export const delete_template_schema = {
  description: "Delete template",
  tags: ["Templates"],
  params: {
    type: "object",
    required: ["template_id"],
    properties: { template_id: { type: "string" } },
  },
  response: {
    200: {
      type: "object",
      properties: base_response,
    },
    404: error_response_schema,
  },
}
