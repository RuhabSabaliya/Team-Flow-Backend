import mongoose from 'mongoose';
import { env } from './env';

/**
 * Database Connection Management
 * 
 * Purpose:
 * Connects Mongoose to the MongoDB database using the validated MONGODB_URI.
 * Monitors connection lifecycle events (connected, error, disconnected).
 */

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    const connection = await mongoose.connect(env.MONGODB_URI);
    console.log(`[MongoDB] Connected successfully to: ${connection.connection.host}:${connection.connection.port}/${connection.connection.name}`);
    return connection;
  } catch (error) {
    console.error('[MongoDB] Connection failure:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected successfully');
}

/**
 * Check the active MongoDB connection state
 * 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
 */
export function getDatabaseStatus(): 'connected' | 'disconnected' | 'connecting' | 'disconnecting' {
  switch (mongoose.connection.readyState) {
    case 1:
      return 'connected';
    case 2:
      return 'connecting';
    case 3:
      return 'disconnecting';
    case 0:
    default:
      return 'disconnected';
  }
}
