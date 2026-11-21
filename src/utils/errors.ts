/**
 * Standard Application Error Classes
 * 
 * Purpose:
 * These error classes provide consistent error codes, HTTP status codes,
 * and optional field-level validation details across all layers of the application.
 */

export interface ErrorDetail {
  field?: string;
  message: string;
}

/**
 * Base Application Error
 * Any expected/operational error should extend AppError.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;
  public readonly details?: ErrorDetail[];

  constructor(
    message: string,
    statusCode = 500,
    code = 'INTERNAL_SERVER_ERROR',
    details?: ErrorDetail[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    this.details = details;

    // Preserve prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 400 Validation Error
 * Used when user input fails Zod schema validation.
 */
export class ValidationError extends AppError {
  constructor(message = 'Validation failed', details?: ErrorDetail[]) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

/**
 * 401 Unauthorized Error
 * Used when authentication is missing or token is invalid.
 */
export class UnauthorizedError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * 403 Forbidden Error
 * Used when user is authenticated but lacks required permission/role for the resource.
 */
export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action') {
    super(message, 403, 'FORBIDDEN');
  }
}

/**
 * 404 Not Found Error
 * Used when a requested resource does not exist.
 */
export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

/**
 * 409 Conflict Error
 * Used for duplicate uniqueness conflicts (e.g. workspace slug or user email already taken).
 */
export class ConflictError extends AppError {
  constructor(message = 'Resource conflict') {
    super(message, 409, 'CONFLICT');
  }
}
