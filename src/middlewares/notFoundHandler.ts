import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../utils/errors';

/**
 * 404 Route Not Found Middleware
 * 
 * Purpose:
 * Catches any HTTP requests that do not match registered routes
 * and delegates a standard NotFoundError to the centralized error handler.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
}
