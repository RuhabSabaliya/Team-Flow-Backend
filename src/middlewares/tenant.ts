import { Request, Response, NextFunction } from 'express';
import { Types } from 'mongoose';
import { Workspace } from '../models/Workspace';
import { WorkspaceMember, WorkspaceRole } from '../models/WorkspaceMember';
import { ForbiddenError, NotFoundError, UnauthorizedError, ValidationError } from '../utils/errors';

/**
 * Tenant Isolation Middleware: requireWorkspaceMember
 * 
 * Security Guardrail:
 * Verifies that the authenticated user actually has an active membership in
 * the workspace identified by :workspaceId.
 * 
 * Prevents cross-tenant IDOR / BOLA attacks:
 * An authenticated user from Tenant A cannot access resources in Tenant B.
 */
export async function requireWorkspaceMember(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const workspaceId = Array.isArray(req.params.workspaceId) ? req.params.workspaceId[0] : req.params.workspaceId;
    if (!workspaceId || !Types.ObjectId.isValid(workspaceId)) {
      throw new ValidationError('Invalid workspace ID format');
    }

    // 1. Verify workspace existence
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    // 2. Query WorkspaceMember collection for membership
    const membership = await WorkspaceMember.findOne({
      workspaceId: workspace._id,
      userId: new Types.ObjectId(req.user.userId)
    });

    if (!membership) {
      throw new ForbiddenError('You are not a member of this workspace');
    }

    // Attach verified tenant context to request
    req.workspace = workspace;
    req.membership = membership;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-Based Access Control Middleware: requireWorkspaceRole
 * 
 * Ensures that the authenticated member has one of the allowed roles.
 */
export function requireWorkspaceRole(allowedRoles: WorkspaceRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.membership) {
      next(new ForbiddenError('Workspace membership context missing'));
      return;
    }

    if (!allowedRoles.includes(req.membership.role)) {
      next(new ForbiddenError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`));
      return;
    }

    next();
  };
}
