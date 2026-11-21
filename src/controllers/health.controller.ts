import { Request, Response, NextFunction } from 'express';
import { healthService } from '../services/health.service';

/**
 * Health Check Controller
 * 
 * Responsibility:
 * Handles incoming HTTP requests for GET /api/v1/health.
 * Invokes the HealthService and returns direct REST payloads with appropriate status codes.
 */
export class HealthController {
  public async check(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await healthService.getHealth();
      const httpStatus = health.status === 'healthy' ? 200 : 503;
      res.status(httpStatus).json(health);
    } catch (error) {
      next(error);
    }
  }
}

export const healthController = new HealthController();
