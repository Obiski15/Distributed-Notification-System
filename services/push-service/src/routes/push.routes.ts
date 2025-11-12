import { FastifyInstance } from "fastify";
import {
  send_push_notification,
  validate_device_token,
} from "../utils/send_push.js";
import {
  PushNotificationSchema,
  TokenValidationSchema,
  PushNotificationResponseSchema,
  TokenValidationResponseSchema,
  ErrorResponseSchema,
} from "../schema/push.schema.js";

export async function pushRoutes(fastify: FastifyInstance) {
  // Send Push Notification
  fastify.post(
    "/send",
    {
      schema: {
        description: "Send a push notification to a specific device",
        tags: ["Push Notifications"],
        body: PushNotificationSchema,
        response: {
          200: PushNotificationResponseSchema,
          400: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const result = await send_push_notification(request.body as any);
        return reply.code(200).send(result);
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: "Internal server error",
          statusCode: 500,
        });
      }
    }
  );

  // Validate Device Token
  fastify.post(
    "/validate-token",
    {
      schema: {
        description: "Validate if an FCM device token is still valid",
        tags: ["Push Notifications"],
        body: TokenValidationSchema,
        response: {
          200: TokenValidationResponseSchema,
          400: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { token } = request.body as { token: string };
        const isValid = await validate_device_token(token);
        return reply.code(200).send({ valid: isValid });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: "Internal server error",
          statusCode: 500,
        });
      }
    }
  );

  // Send Bulk Push Notifications
  fastify.post(
    "/send-bulk",
    {
      schema: {
        description: "Send push notifications to multiple devices",
        tags: ["Push Notifications"],
        body: {
          type: "object",
          required: ["notifications"],
          properties: {
            notifications: {
              type: "array",
              items: PushNotificationSchema,
              description: "Array of push notifications to send",
              minItems: 1,
              maxItems: 100,
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: {
                type: "boolean",
                description: "Whether the bulk operation was successful",
              },
              results: {
                type: "array",
                items: PushNotificationResponseSchema,
                description:
                  "Array of individual results for each notification",
              },
              summary: {
                type: "object",
                properties: {
                  total: {
                    type: "number",
                    description: "Total number of notifications processed",
                  },
                  successful: {
                    type: "number",
                    description: "Number of successful notifications",
                  },
                  failed: {
                    type: "number",
                    description: "Number of failed notifications",
                  },
                },
              },
            },
          },
          400: ErrorResponseSchema,
          500: ErrorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      try {
        const { notifications } = request.body as { notifications: any[] };
        const results = await Promise.all(
          notifications.map((notification) =>
            send_push_notification(notification)
          )
        );

        const successful = results.filter((r) => r.success).length;
        const failed = results.length - successful;

        return reply.code(200).send({
          success: failed === 0,
          results,
          summary: {
            total: results.length,
            successful,
            failed,
          },
        });
      } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: "Internal server error",
          statusCode: 500,
        });
      }
    }
  );

  // Get Service Info
  fastify.get(
    "/info",
    {
      schema: {
        description: "Get push service information and capabilities",
        tags: ["Push Notifications"],
        response: {
          200: {
            type: "object",
            properties: {
              service: {
                type: "string",
                example: "push-service",
              },
              version: {
                type: "string",
                example: "1.0.0",
              },
              capabilities: {
                type: "object",
                properties: {
                  maxBulkNotifications: {
                    type: "number",
                    description:
                      "Maximum number of notifications in bulk request",
                    example: 100,
                  },
                  supportedPlatforms: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    description: "Supported platforms",
                    example: ["android", "ios", "web"],
                  },
                  features: {
                    type: "array",
                    items: {
                      type: "string",
                    },
                    description: "Supported features",
                    example: [
                      "rich_notifications",
                      "custom_data",
                      "priority",
                      "ttl",
                    ],
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      return reply.code(200).send({
        service: "push-service",
        version: "1.0.0",
        capabilities: {
          maxBulkNotifications: 100,
          supportedPlatforms: ["android", "ios", "web"],
          features: ["rich_notifications", "custom_data", "priority", "ttl"],
        },
      });
    }
  );
}
