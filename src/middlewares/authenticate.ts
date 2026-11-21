import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens';
import { UnauthorizedError } from '../utils/errors';

/**
 * Authentication Middleware
 * 
 * Extracts JWT token from:
 * 1. Primary: HttpOnly cookie `accessToken`
 * 2. Secondary: `Authorization: Bearer <token>` header
 * 
 * Verifies token and attaches user payload to `req.user`.
 * Throws 401 UnauthorizedError if token is absent, invalid, or expired.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // 1. Check HttpOnly cookie
    if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    // 2. Check Authorization header
    const authHeader = req.headers.authorization;
    if (!token && authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    }

    if (!token) {
      throw new UnauthorizedError('Authentication token is required');
    }

    // 3. Verify access token
    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new UnauthorizedError('Authentication token has expired'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new UnauthorizedError('Invalid authentication token'));
    } else {
      next(error);
    }
  }
}
