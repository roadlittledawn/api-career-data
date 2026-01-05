/**
 * GraphQL Error Handling Utilities
 *
 * This module provides centralized error handling for the Career Data API.
 * It maps internal errors to GraphQL-compliant error codes, implements
 * server-side logging, and sanitizes error messages for client responses.
 *
 * Requirements: 11.4, 6.5, 7.5, 8.5
 */

import { GraphQLError } from "graphql";

// ============================================================================
// Error Codes
// ============================================================================

/**
 * Standard GraphQL error codes used by the API.
 * These codes are included in the error extensions for client handling.
 */
export const ErrorCodes = {
  /** Missing or invalid API key */
  UNAUTHENTICATED: "UNAUTHENTICATED",
  /** Invalid input data or missing required fields */
  BAD_USER_INPUT: "BAD_USER_INPUT",
  /** Requested entity does not exist */
  NOT_FOUND: "NOT_FOUND",
  /** External service failure (Anthropic API, MongoDB) */
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  /** Anthropic API specific failure */
  AI_SERVICE_ERROR: "AI_SERVICE_ERROR",
  /** MongoDB specific failure */
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

// ============================================================================
// Error Classes
// ============================================================================

/**
 * Base class for API errors with GraphQL error code support.
 */
export class APIError extends Error {
  public readonly code: ErrorCode;
  public readonly details?: Record<string, unknown>;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: ErrorCode,
    details?: Record<string, unknown>,
    originalError?: Error
  ) {
    super(message);
    this.name = "APIError";
    this.code = code;
    this.details = details;
    this.originalError = originalError;
  }
}

/**
 * Error thrown when authentication fails.
 */
export class AuthenticationError extends APIError {
  constructor(message: string = "Authentication required") {
    super(message, ErrorCodes.UNAUTHENTICATED);
    this.name = "AuthenticationError";
  }
}

/**
 * Error thrown when input validation fails.
 */
export class ValidationError extends APIError {
  constructor(message: string, missingFields?: string[]) {
    super(message, ErrorCodes.BAD_USER_INPUT, { missingFields });
    this.name = "ValidationError";
  }
}

/**
 * Error thrown when a requested entity is not found.
 */
export class NotFoundError extends APIError {
  constructor(entityName: string, id: string) {
    super(`${entityName} with ID ${id} not found`, ErrorCodes.NOT_FOUND, {
      entityName,
      id,
    });
    this.name = "NotFoundError";
  }
}

/**
 * Error thrown when the Anthropic API fails.
 * Requirements: 6.5, 7.5, 8.5
 */
export class AIServiceError extends APIError {
  constructor(message: string, originalError?: Error) {
    super(message, ErrorCodes.AI_SERVICE_ERROR, undefined, originalError);
    this.name = "AIServiceError";
  }
}

/**
 * Error thrown when MongoDB operations fail.
 */
export class DatabaseError extends APIError {
  constructor(message: string, originalError?: Error) {
    super(message, ErrorCodes.DATABASE_ERROR, undefined, originalError);
    this.name = "DatabaseError";
  }
}

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Logger interface for error logging.
 * This allows for dependency injection of different logging implementations.
 */
export interface ErrorLogger {
  error(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
}

/**
 * Default console-based error logger.
 */
export const defaultLogger: ErrorLogger = {
  error(message: string, meta?: Record<string, unknown>): void {
    console.error(`[ERROR] ${message}`, meta ? JSON.stringify(meta) : "");
  },
  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(`[WARN] ${message}`, meta ? JSON.stringify(meta) : "");
  },
};

// Current logger instance (can be replaced for testing)
let logger: ErrorLogger = defaultLogger;

/**
 * Sets the error logger instance.
 * Useful for testing or integrating with external logging services.
 */
export function setErrorLogger(newLogger: ErrorLogger): void {
  logger = newLogger;
}

/**
 * Gets the current error logger instance.
 */
export function getErrorLogger(): ErrorLogger {
  return logger;
}

/**
 * Logs an error with context information for server-side debugging.
 */
export function logError(
  error: Error,
  context?: Record<string, unknown>
): void {
  const meta: Record<string, unknown> = {
    errorName: error.name,
    errorMessage: error.message,
    stack: error.stack,
    ...context,
  };

  if (error instanceof APIError) {
    meta.code = error.code;
    meta.details = error.details;
    if (error.originalError) {
      meta.originalError = {
        name: error.originalError.name,
        message: error.originalError.message,
        stack: error.originalError.stack,
      };
    }
  }

  logger.error("API Error occurred", meta);
}

// ============================================================================
// Error Sanitization
// ============================================================================

/**
 * Messages that are safe to expose to clients.
 * Internal error details are replaced with generic messages.
 */
const SAFE_ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ErrorCodes.UNAUTHENTICATED]: "Authentication required",
  [ErrorCodes.BAD_USER_INPUT]: "Invalid input provided",
  [ErrorCodes.NOT_FOUND]: "Resource not found",
  [ErrorCodes.INTERNAL_SERVER_ERROR]: "An internal error occurred",
  [ErrorCodes.AI_SERVICE_ERROR]: "AI service is temporarily unavailable",
  [ErrorCodes.DATABASE_ERROR]: "Database service is temporarily unavailable",
};

/**
 * Determines if an error message is safe to expose to clients.
 * Validation errors and not found errors typically have safe messages.
 */
function isMessageSafe(error: APIError): boolean {
  // Validation and not found errors have user-friendly messages
  return (
    error.code === ErrorCodes.BAD_USER_INPUT ||
    error.code === ErrorCodes.NOT_FOUND
  );
}

/**
 * Sanitizes an error message for client responses.
 * Internal error details are replaced with generic messages.
 */
export function sanitizeErrorMessage(error: APIError): string {
  if (isMessageSafe(error)) {
    return error.message;
  }
  return (
    SAFE_ERROR_MESSAGES[error.code] ||
    SAFE_ERROR_MESSAGES[ErrorCodes.INTERNAL_SERVER_ERROR]
  );
}

// ============================================================================
// GraphQL Error Conversion
// ============================================================================

/**
 * Converts an APIError to a GraphQL-compliant error.
 * Logs the error server-side and sanitizes the message for clients.
 */
export function toGraphQLError(
  error: APIError,
  context?: Record<string, unknown>
): GraphQLError {
  // Log the full error server-side
  logError(error, context);

  // Build extensions object
  const extensions: Record<string, unknown> = {
    code: error.code,
  };

  // Include details for validation errors (they're user-facing)
  if (error.code === ErrorCodes.BAD_USER_INPUT && error.details) {
    extensions.details = error.details;
  }

  // Include entity info for not found errors
  if (error.code === ErrorCodes.NOT_FOUND && error.details) {
    extensions.entityName = error.details.entityName;
    extensions.entityId = error.details.id;
  }

  return new GraphQLError(sanitizeErrorMessage(error), {
    extensions,
  });
}

/**
 * Wraps an unknown error into an appropriate APIError.
 * Used to handle unexpected errors from external services.
 */
export function wrapError(
  error: unknown,
  defaultMessage: string = "An unexpected error occurred"
): APIError {
  if (error instanceof APIError) {
    return error;
  }

  if (error instanceof GraphQLError) {
    // Already a GraphQL error, extract code if present
    const code =
      (error.extensions?.code as ErrorCode) || ErrorCodes.INTERNAL_SERVER_ERROR;
    return new APIError(
      error.message,
      code,
      error.extensions as Record<string, unknown>
    );
  }

  if (error instanceof Error) {
    return new APIError(
      defaultMessage,
      ErrorCodes.INTERNAL_SERVER_ERROR,
      undefined,
      error
    );
  }

  return new APIError(defaultMessage, ErrorCodes.INTERNAL_SERVER_ERROR);
}

// ============================================================================
// Error Handler for Resolvers
// ============================================================================

/**
 * Wraps a resolver function with error handling.
 * Catches errors, logs them, and converts them to GraphQL errors.
 *
 * @param resolverFn - The resolver function to wrap
 * @param context - Additional context for error logging
 * @returns Wrapped resolver function
 */
export function withErrorHandling<TArgs, TResult>(
  resolverFn: (parent: unknown, args: TArgs) => Promise<TResult>,
  context?: Record<string, unknown>
): (parent: unknown, args: TArgs) => Promise<TResult> {
  return async (parent: unknown, args: TArgs): Promise<TResult> => {
    try {
      return await resolverFn(parent, args);
    } catch (error) {
      const apiError = wrapError(error);
      throw toGraphQLError(apiError, { ...context, args });
    }
  };
}

// ============================================================================
// Anthropic API Error Handling
// ============================================================================

/**
 * Handles errors from the Anthropic API.
 * Maps Anthropic-specific errors to appropriate API errors.
 * Requirements: 6.5, 7.5, 8.5
 */
export function handleAnthropicError(error: unknown): never {
  const wrappedError =
    error instanceof Error ? error : new Error(String(error));

  // Log the full error for debugging
  logError(wrappedError, { service: "anthropic" });

  // Check for specific Anthropic error types
  if (wrappedError.message.includes("API key")) {
    throw new AIServiceError("AI service configuration error", wrappedError);
  }

  if (wrappedError.message.includes("rate limit")) {
    throw new AIServiceError(
      "AI service rate limit exceeded. Please try again later.",
      wrappedError
    );
  }

  if (wrappedError.message.includes("timeout")) {
    throw new AIServiceError(
      "AI service request timed out. Please try again.",
      wrappedError
    );
  }

  // Generic AI service error
  throw new AIServiceError(
    "Failed to generate content. Please try again later.",
    wrappedError
  );
}

// ============================================================================
// MongoDB Error Handling
// ============================================================================

/**
 * Handles errors from MongoDB operations.
 * Maps MongoDB-specific errors to appropriate API errors.
 */
export function handleDatabaseError(error: unknown): never {
  const wrappedError =
    error instanceof Error ? error : new Error(String(error));

  // Log the full error for debugging
  logError(wrappedError, { service: "mongodb" });

  // Check for specific MongoDB error types
  if (wrappedError.message.includes("connection")) {
    throw new DatabaseError(
      "Database connection error. Please try again later.",
      wrappedError
    );
  }

  if (wrappedError.message.includes("duplicate key")) {
    throw new ValidationError("A record with this identifier already exists");
  }

  // Generic database error
  throw new DatabaseError(
    "Database operation failed. Please try again later.",
    wrappedError
  );
}

// ============================================================================
// Mercurius Error Formatter
// ============================================================================

import type { ExecutionResult } from "graphql";

/**
 * Error formatter for Mercurius GraphQL plugin.
 * This function is called by Mercurius to format errors before sending to clients.
 *
 * @param error - The GraphQL execution error
 * @returns Formatted error for client response
 */
export function formatGraphQLError(error: GraphQLError): GraphQLError {
  // If it's already a properly formatted error, return as-is
  if (error.extensions?.code) {
    return error;
  }

  // Wrap unknown errors
  const apiError = wrapError(error.originalError || error);

  // Log and convert to GraphQL error
  return toGraphQLError(apiError);
}

/**
 * Creates the error formatter configuration for Mercurius.
 * This should be passed to the Mercurius plugin options.
 */
export function createErrorFormatter() {
  return <TContext>(
    execution: ExecutionResult & Required<Pick<ExecutionResult, "errors">>,
    _context: TContext
  ) => {
    const errors = execution.errors.map((error) => {
      // Log the error for server-side debugging
      logError(error, { context: "graphql-execution" });

      // Format the error for client response
      return formatGraphQLError(error);
    });

    // Determine appropriate status code based on error types
    const hasAuthError = errors.some(
      (e) => e.extensions?.code === ErrorCodes.UNAUTHENTICATED
    );
    const hasNotFoundError = errors.some(
      (e) => e.extensions?.code === ErrorCodes.NOT_FOUND
    );
    const hasValidationError = errors.some(
      (e) => e.extensions?.code === ErrorCodes.BAD_USER_INPUT
    );

    let statusCode = 200;
    if (hasAuthError) {
      statusCode = 401;
    } else if (hasNotFoundError) {
      statusCode = 404;
    } else if (hasValidationError) {
      statusCode = 400;
    }

    return {
      statusCode,
      response: {
        data: execution.data,
        errors,
      },
    };
  };
}
