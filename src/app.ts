import express, { Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import v1Router from './routes';
import { errorHandler } from './middlewares/errorHandler';
import { notFoundHandler } from './middlewares/notFoundHandler';

/**
 * Express Application Configuration
 * 
 * Middleware Pipeline Order:
 * 1. CORS - Restricts allowed origins (e.g. Next.js on port 2004)
 * 2. express.json - Parses incoming JSON request payloads
 * 3. cookieParser - Parses cookies attached to incoming requests (for HttpOnly JWTs)
 * 4. /api/v1 routes - Mounts all version 1 endpoints
 * 5. notFoundHandler - Catches any unmatched route and raises 404 AppError
 * 6. errorHandler - Central error handler producing the standard error JSON
 */
export function createApp(): Application {
  const app = express();

  // 1. CORS security header configuration
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
  }));

  // 2. Request body parsing
  app.use(express.json());

  // 3. Cookie parsing for HttpOnly tokens
  app.use(cookieParser());

  // 4. Mount versioned API routes
  app.use('/api/v1', v1Router);

  // 5. Handle undefined routes
  app.use(notFoundHandler);

  // 6. Central error handler
  app.use(errorHandler);

  return app;
}
