import base_response from "@dns/shared/schemas/base-response.js"
import error_response_schema from "@dns/shared/schemas/error-response-schema.js"

const userObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    name: { type: "string" },
    email: { type: "string", format: "email" },
    preferences: {
      type: "object",
      properties: {
        push_notification_enabled: { type: "boolean" },
        email_notification_enabled: { type: "boolean" },
      },
    },
    push_tokens: {
      type: "array",
      items: { type: "string" },
    },
  },
}

export const user_schema = {
  description: "Retrieve a logged in user",
  tags: ["User"],
  response: {
    200: {
      type: "object",
      properties: {
        ...base_response,
        data: userObject,
      },
    },
    500: error_response_schema,
  },
}

export const update_user_schema = {
  description: "Update an existing user information",
  tags: ["User"],

  body: {
    type: "object",
    minProperties: 1,
    additionalProperties: false,
    properties: {
      name: { type: "string", minLength: 2 },
      email: { type: "string", format: "email" },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        ...base_response,
        data: {
          type: "object",
          properties: {
            name: { type: "string" },
            email: { type: "string" },
          },
        },
      },
    },
    500: error_response_schema,
    409: error_response_schema,
  },
}

export const update_preferences_schema = {
  description: "Update a user notification preference",
  tags: ["User"],
  body: {
    type: "object",
    required: ["preferences"],
    additionalProperties: false,
    properties: {
      preferences: {
        type: "object",
        minProperties: 1,
        additionalProperties: false,
        properties: {
          push_notification_enabled: { type: "boolean" },
          email_notification_enabled: { type: "boolean" },
        },
      },
    },
  },
  response: {
    200: {
      type: "object",
      properties: {
        ...base_response,
        data: {
          type: "object",
          properties: {
            preferences: {
              type: "object",
              properties: {
                push_notification_enabled: { type: "boolean" },
                email_notification_enabled: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    500: error_response_schema,
  },
}

export const push_token_schema = {
  description: "Add a push token for a user",
  tags: ["User"],
  body: {
    type: "object",
    required: ["token"],
    additionalProperties: false,
    properties: {
      token: { type: "string", minLength: 5 },
    },
  },
  response: {
    200: {
      type: "object",
      properties: base_response,
    },
    500: error_response_schema,
  },
}
