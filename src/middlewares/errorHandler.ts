import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { env } from '../config/env';

/**
 * Central Error Handling Middleware
 * 
 * Purpose:
 * Intercepts all thrown or next(err) errors and converts them into the exact
 * agreed-upon API error envelope:
 * 
 * {
 *   "error": {
 *     "code": "VALIDATION_ERROR",
 *     "message": "Validation failed",
 *     "details": [
 *       { "field": "email", "message": "Invalid email" }
 *     ]
 *   }
 * }
 * 
 * Security Guardrails:
 * - Does not duplicate the HTTP status code in the response body.
 * - Does not expose raw internal technical errors, database errors, or stack traces.
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Check if error is an expected operational AppError
  if (err instanceof AppError && err.isOperational) {
    res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        ...(err.details && err.details.length > 0 ? { details: err.details } : {})
      }
    });
    return;
  }

  // Handle unexpected or internal unhandled errors
  if (env.NODE_ENV !== 'production') {
    console.error('[UNHANDLED ERROR]:', err);
  }

  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected internal error occurred'
    }
  });
}
