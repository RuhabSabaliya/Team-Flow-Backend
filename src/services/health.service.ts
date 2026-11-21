import { getDatabaseStatus } from '../config/database';

/**
 * Health Check Service
 * 
 * Responsibility:
 * Gathers system operational metrics (uptime, environment, database state).
 * Separates the health check business logic from Express HTTP controller semantics.
 */

export interface SystemHealth {
  status: 'healthy' | 'degraded';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  database: {
    status: 'connected' | 'disconnected' | 'connecting' | 'disconnecting';
  };
}

export class HealthService {
  public async getHealth(): Promise<SystemHealth> {
    const dbStatus = getDatabaseStatus();

    return {
      status: dbStatus === 'connected' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbStatus
      }
    };
  }
}

export const healthService = new HealthService();
