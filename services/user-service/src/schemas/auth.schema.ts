import base_response from "@shared/schemas/base-response.js"
import error_response_schema from "@shared/schemas/error-response-schema.js"

const userObject = {
  type: "object",
  properties: {
    id: { type: "string", format: "uuid" },
    email: { type: "string", format: "email" },
    name: { type: "string" },
    created_at: { type: "string" },
    updated_at: { type: "string" },
  },
}

const tokens_schema = {
  type: "object",
  properties: {
    access_token: { type: "string" },
    refresh_token: { type: "string" },
  },
}

export const register_schema = {
  description: "Register a new user",
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["email", "password", "name"],
    additionalProperties: false,
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "User email address",
      },
      password: {
        type: "string",
        minLength: 6,
        maxLength: 100,
        description: "User password (minimum 6 characters)",
      },
      name: {
        type: "string",
        minLength: 2,
        maxLength: 100,
        description: "User full name",
      },
    },
  },
  response: {
    201: {
      type: "object",
      properties: {
        ...base_response,
        data: {
          type: "object",
          properties: {
            user: userObject,
            tokens: tokens_schema,
          },
        },
      },
    },
    400: error_response_schema,
    409: error_response_schema,
    500: error_response_schema,
  },
}

export const login_schema = {
  description: "Login a user",
  tags: ["Auth"],
  body: {
    type: "object",
    required: ["email", "password"],
    additionalProperties: false,
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "User email address",
      },
      password: {
        type: "string",
        description: "User password",
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
            user: userObject,
            tokens: tokens_schema,
          },
        },
      },
    },
    400: error_response_schema,
    401: error_response_schema,
    500: error_response_schema,
  },
}
