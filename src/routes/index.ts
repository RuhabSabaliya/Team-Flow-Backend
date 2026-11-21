import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import workspaceRoutes from './workspace.routes';

/**
 * API v1 Root Router
 * 
 * Mounts:
 * - /api/v1/health
 * - /api/v1/auth
 * - /api/v1/workspaces
 */
const v1Router = Router();

v1Router.use('/', healthRoutes);
v1Router.use('/auth', authRoutes);
v1Router.use('/workspaces', workspaceRoutes);

export default v1Router;
