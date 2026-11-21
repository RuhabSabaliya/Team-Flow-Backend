import { createApp } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';

/**
 * Server Startup & Lifecycle Management
 * 
 * Responsibility:
 * 1. Connects to MongoDB.
 * 2. Starts the HTTP server on the configured PORT (2811).
 * 3. Handles graceful shutdown on SIGINT / SIGTERM signals.
 */
async function startServer(): Promise<void> {
  try {
    // 1. Connect to MongoDB before accepting HTTP traffic
    await connectDatabase();

    // 2. Initialize Express application
    const app = createApp();

    // 3. Start listening on configured port
    const server = app.listen(env.PORT, () => {
      console.log(`[TeamFlow Backend] Server running at http://localhost:${env.PORT}`);
      console.log(`[TeamFlow Backend] Environment: ${env.NODE_ENV}`);
      console.log(`[TeamFlow Backend] Health check: http://localhost:${env.PORT}/api/v1/health`);
    });

    // Graceful shutdown handling
    const shutdown = async (signal: string) => {
      console.log(`\n[TeamFlow Backend] Received ${signal}. Initiating graceful shutdown...`);
      server.close(async () => {
        console.log('[TeamFlow Backend] HTTP server closed');
        await disconnectDatabase();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    console.error('[TeamFlow Backend] Failed to start server:', error);
    process.exit(1);
  }
}

// Start execution
startServer();
