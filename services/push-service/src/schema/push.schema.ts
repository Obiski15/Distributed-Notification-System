export const PushNotificationSchema = {
  type: 'object',
  required: ['token', 'title', 'body'],
  properties: {
    token: {
      type: 'string',
      description: 'FCM device token',
      example: 'fcm_token_string_here'
    },
    title: {
      type: 'string',
      description: 'Notification title',
      example: 'New Message'
    },
    body: {
      type: 'string',
      description: 'Notification body text',
      example: 'You have received a new message'
    },
    image: {
      type: 'string',
      description: 'Optional image URL for the notification',
      example: 'https://example.com/image.jpg'
    },
    link: {
      type: 'string',
      description: 'Optional deep link to open when notification is clicked',
      example: 'https://example.com/messages/123'
    },
    data: {
      type: 'object',
      description: 'Optional custom data payload',
      additionalProperties: {
        type: 'string'
      },
      example: {
        messageId: '12345',
        userId: 'user123'
      }
    },
    priority: {
      type: 'string',
      enum: ['high', 'normal'],
      description: 'Notification priority',
      example: 'normal'
    },
    ttl: {
      type: 'number',
      description: 'Time to live in seconds',
      example: 3600
    }
  }
};

export const TokenValidationSchema = {
  type: 'object',
  required: ['token'],
  properties: {
    token: {
      type: 'string',
      description: 'FCM device token to validate',
      example: 'fcm_token_string_here'
    }
  }
};

export const PushNotificationResponseSchema = {
  type: 'object',
  properties: {
    success: {
      type: 'boolean',
      description: 'Whether the operation was successful',
      example: true
    },
    messageId: {
      type: 'string',
      description: 'FCM message ID if successful',
      example: 'projects/project-id/messages/message-id'
    },
    error: {
      type: 'string',
      description: 'Error message if failed',
      example: 'Invalid registration token'
    }
  }
};

export const TokenValidationResponseSchema = {
  type: 'object',
  properties: {
    valid: {
      type: 'boolean',
      description: 'Whether the token is valid',
      example: true
    }
  }
};

export const ErrorResponseSchema = {
  type: 'object',
  properties: {
    error: {
      type: 'string',
      description: 'Error message',
      example: 'Internal server error'
    },
    statusCode: {
      type: 'number',
      description: 'HTTP status code',
      example: 500
    }
  }
};

export const HealthResponseSchema = {
  type: 'object',
  properties: {
    status: {
      type: 'string',
      description: 'Service health status',
      example: 'ok'
    },
    timestamp: {
      type: 'string',
      format: 'date-time',
      description: 'Current timestamp',
      example: '2023-12-07T10:30:00.000Z'
    },
    uptime: {
      type: 'number',
      description: 'Service uptime in seconds',
      example: 3600
    }
  }
};