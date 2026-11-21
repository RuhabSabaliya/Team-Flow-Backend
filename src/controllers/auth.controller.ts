import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { env } from '../config/env';
import { UnauthorizedError } from '../utils/errors';

/**
 * Auth Controller
 * 
 * Handles HTTP requests, sets HttpOnly cookies, and returns direct REST payloads.
 */

// Helper to set secure HttpOnly cookies
function setAuthCookies(res: Response, accessToken: string, refreshToken: string) {
  const isProduction = env.NODE_ENV === 'production';

  // Access Token Cookie (15 minutes)
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000 // 15 mins
  });

  // Refresh Token Cookie (7 days)
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
}

// Helper to clear cookies on logout
function clearAuthCookies(res: Response) {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
}

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  public async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.register(req.body);
      setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  public async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await authService.login(req.body);
      setAuthCookies(res, result.tokens.accessToken, result.tokens.refreshToken);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  public async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Check cookie first, fallback to request body
      const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!rawToken) {
        throw new UnauthorizedError('Refresh token is required');
      }

      const tokens = await authService.refreshToken(rawToken);
      setAuthCookies(res, tokens.accessToken, tokens.refreshToken);
      res.status(200).json({ tokens });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  public async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const rawToken = req.cookies?.refreshToken || req.body?.refreshToken;
      await authService.logout(rawToken, req.user?.userId);
      clearAuthCookies(res);
      res.status(200).json({ message: 'Successfully logged out' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  public async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const user = await authService.getMe(req.user.userId);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/auth/profile
   */
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const user = await authService.updateProfile(req.user.userId, req.body);
      res.status(200).json(user);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/change-password
   */
  public async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }
      const result = await authService.changePassword(req.user.userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
