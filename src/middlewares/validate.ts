import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError, ErrorDetail } from '../utils/errors';

/**
 * Zod Request Validation Middleware
 * 
 * Purpose:
 * Validates untrusted incoming client requests at the API boundary.
 * Supports validating `body`, `query`, or `params`.
 * 
 * Note on Express 5:
 * In Express 5, `req.query` is defined with a getter on IncomingMessage, so reassigning
 * `req.query = ...` throws a TypeError. We mutate the object in place using Object.assign.
 */
interface RequestValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validate(schemas: RequestValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        const parsed = await schemas.query.parseAsync(req.query);
        for (const key of Object.keys(req.query)) {
          delete (req.query as any)[key];
        }
        Object.assign(req.query, parsed);
      }
      if (schemas.params) {
        const parsed = await schemas.params.parseAsync(req.params);
        for (const key of Object.keys(req.params)) {
          delete (req.params as any)[key];
        }
        Object.assign(req.params, parsed);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details: ErrorDetail[] = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message
        }));

        next(new ValidationError('Validation failed', details));
      } else {
        next(error);
      }
    }
  };
}
