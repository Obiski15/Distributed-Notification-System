// GENERAL SUCCESS
export const OPERATION_SUCCESSFUL = "Operation completed successfully."
export const FETCH_SUCCESSFUL = "Data retrieved successfully."
export const CREATED_SUCCESSFUL = "Resource created successfully."
export const DELETED_SUCCESSFUL = "Resource deleted successfully."

// GENERAL ERRORS
export const INTERNAL_SERVER_ERROR =
  "An unexpected error occurred. Please try again later."
export const SERVICE_UNAVAILABLE = "The service is currently unavailable."
export const RESOURCE_NOT_FOUND = "The requested resource was not found."
export const BAD_REQUEST =
  "The request could not be processed due to invalid syntax."
export const REQUEST_TIMEOUT = "The request timed out."

// TEMPLATES
export const TEMPLATE_LIST_RETRIEVED = "Template list retrieved successfully."
export const TEMPLATE_RETRIEVED = "Template retrieved successfully."
export const TEMPLATE_UPDATED = "Template updated successfully."
export const TEMPLATE_CREATED = "Template created successfully."
export const TEMPLATE_DELETED = "Template deleted successfully."
export const TEMPLATE_ALREADY_EXISTS =
  "Template with this name and version already exists."
export const TEMPLATE_NOT_FOUND = "Template not found."
export const NO_VALID_TEMPLATE_UPDATE_FIELDS =
  "No valid fields provided for update."

// USERS/AUTH
export const USER_RETRIEVED = "User retrieved successfully."
export const USER_UPDATED = "User information updated successfully."
export const USER_CREATED = "User account created successfully."
export const USER_DELETED = "User account deleted successfully."
export const USER_NOT_FOUND = "User not found"
export const LOGIN_SUCCESSFUL = "Login successful."
export const MISSING_USERID_HEADER = "x-user-id header is missing."
export const NOTIFICATION_PREFERENCE_UPDATED =
  "Notification preferences updated successfully."
export const INVALID_CREDENTIALS = "Invalid credentials."
export const USER_ALREADY_EXISTS = "User with this email already exists."
export const INVALID_PASSWORD_FORMAT =
  "Password is required and must be at least 6 characters."
export const NO_VALID_UPDATE_FIELDS =
  "No valid fields provided. Only 'name' and 'email' can be updated."
export const PUSH_TOKEN_UPDATED = "User push tokens updated successfully."
export const PUSH_TOKEN_ALREADY_EXISTS = "Push token already exists."

// NOTIFICATIONS
export const REQUEST_ID_REQUIRED = "request_id is required."
export const NOTIFICATIONS_DISABLED = "notifications disabled by user."
export const NOTIFICATION_ALREADY_PROCESSED = "Notification already processed."
export const NOTIFICATION_PREVIOUSLY_FAILED = "Notification previously failed."
export const NOTIFICATION_QUEUED = "notification queued successfully."
export const NOTIFICATION_STATUS_UPDATED = "notification status updated."
export const QUEUE_PUBLISH_FAILED = "Failed to queue notification request."
export const NOTIFICATION_RETRIEVED = "Notification retrieved successfully"
export const NOTIFICATION_NOT_FOUND = "Notification with that id not found"

// PUSH NOTIFICATIONS
export const INVALID_FCM_TOKEN = "Invalid or missing FCM registration token"

// CORS
export const CORS_ORIGIN_NOT_ALLOWED = "Origin not allowed by CORS"

// AUTHENTICATION
export const MISSING_AUTH_TOKEN = "Missing auth token"
export const INVALID_AUTH_TOKEN = "Invalid auth token"
export const UNAUTHORIZED = "Unauthorized"

// GATEWAY
export const BAD_GATEWAY = "Error communicating with upstream service"

// DATABASE
export const DATABASE_INITIALIZATION_ERROR = "Database initialization failed."
export const DATABASE_INITIALIZED = "Database initialized successfully."
export const DATABASE_CONNECTION_CLOSE_ERROR =
  "Error closing database connection."
export const DATABASE_CONNECTION_CLOSED =
  "Database connection closed successfully."
