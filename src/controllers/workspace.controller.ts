import { Request, Response, NextFunction } from 'express';
import { workspaceService } from '../services/workspace.service';

/**
 * Workspace Controller
 * 
 * Translates HTTP requests to WorkspaceService operations and sends Direct REST payloads.
 */
export class WorkspaceController {
  /**
   * POST /api/v1/workspaces
   */
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspace = await workspaceService.createWorkspace(req.user!.userId, req.body);
      res.status(201).json(workspace);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/workspaces
   */
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaces = await workspaceService.getUserWorkspaces(req.user!.userId);
      res.status(200).json(workspaces);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/workspaces/:workspaceId
   */
  public async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await workspaceService.getWorkspaceById(req.workspace!, req.membership!);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/workspaces/:workspaceId
   */
  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const updated = await workspaceService.updateWorkspace(req.workspace!, req.body);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/workspaces/:workspaceId
   */
  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await workspaceService.deleteWorkspace(req.workspace!);
      res.status(200).json({ message: 'Workspace deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/workspaces/:workspaceId/members
   */
  public async listMembers(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const members = await workspaceService.getWorkspaceMembers(req.workspace!._id as any);
      res.status(200).json(members);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/workspaces/:workspaceId/members
   */
  public async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const member = await workspaceService.addWorkspaceMember(
        req.workspace!._id as any,
        req.user!.userId,
        req.body
      );
      res.status(201).json(member);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/workspaces/:workspaceId/members/:memberId
   */
  public async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = Array.isArray(req.params.memberId) ? req.params.memberId[0] : req.params.memberId;
      const updated = await workspaceService.updateMemberRole(
        req.workspace!,
        memberId,
        req.user!.userId,
        req.membership!.role,
        req.body
      );
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/workspaces/:workspaceId/members/:memberId
   */
  public async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const memberId = Array.isArray(req.params.memberId) ? req.params.memberId[0] : req.params.memberId;
      await workspaceService.removeWorkspaceMember(
        req.workspace!,
        memberId,
        req.user!.userId,
        req.membership!.role
      );
      res.status(200).json({ message: 'Member removed successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/workspaces/:workspaceId/invitations
   */
  public async listInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitations = await workspaceService.getWorkspaceInvitations(req.workspace!._id as any);
      res.status(200).json(invitations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/workspaces/:workspaceId/invitations/:invitationId
   */
  public async cancelInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitationId = Array.isArray(req.params.invitationId) ? req.params.invitationId[0] : req.params.invitationId;
      await workspaceService.cancelWorkspaceInvitation(req.workspace!._id as any, invitationId);
      res.status(200).json({ message: 'Invitation cancelled successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/workspaces/invitations/me
   */
  public async listUserInvitations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitations = await workspaceService.getUserInvitations(req.user!.email);
      res.status(200).json(invitations);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/workspaces/invitations/:invitationId/accept
   */
  public async acceptInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitationId = Array.isArray(req.params.invitationId) ? req.params.invitationId[0] : req.params.invitationId;
      const result = await workspaceService.acceptInvitation(req.user!.userId, req.user!.email, invitationId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/workspaces/invitations/:invitationId/decline
   */
  public async declineInvitation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const invitationId = Array.isArray(req.params.invitationId) ? req.params.invitationId[0] : req.params.invitationId;
      const result = await workspaceService.declineInvitation(req.user!.email, invitationId);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const workspaceController = new WorkspaceController();
