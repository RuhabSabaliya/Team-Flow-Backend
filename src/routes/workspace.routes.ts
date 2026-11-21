import { Router } from 'express';
import { workspaceController } from '../controllers/workspace.controller';
import { taskController } from '../controllers/task.controller';
import { commentController } from '../controllers/comment.controller';
import { authenticate } from '../middlewares/authenticate';
import { requireWorkspaceMember, requireWorkspaceRole } from '../middlewares/tenant';
import { validate } from '../middlewares/validate';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  addMemberSchema,
  updateMemberRoleSchema
} from '../validations/workspace.validation';
import { updateTaskSchema } from '../validations/task.validation';
import { createCommentSchema } from '../validations/comment.validation';
import projectRoutes from './project.routes';

const router = Router();

// All workspace routes require authentication
router.use(authenticate);

/**
 * User-level Invitation Routes (Outside workspace-scoped URLs)
 */
router.get(
  '/invitations/me',
  (req, res, next) => workspaceController.listUserInvitations(req, res, next)
);

router.post(
  '/invitations/:invitationId/accept',
  (req, res, next) => workspaceController.acceptInvitation(req, res, next)
);

router.post(
  '/invitations/:invitationId/decline',
  (req, res, next) => workspaceController.declineInvitation(req, res, next)
);

/**
 * Top-Level Workspace Routes
 */
router.post(
  '/',
  validate({ body: createWorkspaceSchema }),
  (req, res, next) => workspaceController.create(req, res, next)
);

router.get(
  '/',
  (req, res, next) => workspaceController.list(req, res, next)
);

/**
 * Workspace Scoped Routes (Require Valid Membership)
 */
router.get(
  '/:workspaceId',
  requireWorkspaceMember,
  (req, res, next) => workspaceController.getOne(req, res, next)
);

router.patch(
  '/:workspaceId',
  requireWorkspaceMember,
  requireWorkspaceRole(['owner', 'admin']),
  validate({ body: updateWorkspaceSchema }),
  (req, res, next) => workspaceController.update(req, res, next)
);

router.delete(
  '/:workspaceId',
  requireWorkspaceMember,
  requireWorkspaceRole(['owner']),
  (req, res, next) => workspaceController.delete(req, res, next)
);

/**
 * Workspace Member Management Routes
 */
router.get(
  '/:workspaceId/members',
  requireWorkspaceMember,
  (req, res, next) => workspaceController.listMembers(req, res, next)
);

router.post(
  '/:workspaceId/members',
  requireWorkspaceMember,
  requireWorkspaceRole(['owner', 'admin']),
  validate({ body: addMemberSchema }),
  (req, res, next) => workspaceController.addMember(req, res, next)
);

router.patch(
  '/:workspaceId/members/:memberId',
  requireWorkspaceMember,
  requireWorkspaceRole(['owner', 'admin']),
  validate({ body: updateMemberRoleSchema }),
  (req, res, next) => workspaceController.updateMemberRole(req, res, next)
);

router.delete(
  '/:workspaceId/members/:memberId',
  requireWorkspaceMember,
  (req, res, next) => workspaceController.removeMember(req, res, next)
);

/**
 * Workspace Pending Invitation Routes (Owner or Admin only)
 */
router.get(
  '/:workspaceId/invitations',
  requireWorkspaceMember,
  requireWorkspaceRole(['owner', 'admin']),
  (req, res, next) => workspaceController.listInvitations(req, res, next)
);

router.delete(
  '/:workspaceId/invitations/:invitationId',
  requireWorkspaceMember,
  requireWorkspaceRole(['owner', 'admin']),
  (req, res, next) => workspaceController.cancelInvitation(req, res, next)
);

/**
 * Mount Nested Project Routes (/api/v1/workspaces/:workspaceId/projects)
 */
router.use('/:workspaceId/projects', requireWorkspaceMember, projectRoutes);

/**
 * Direct Task Routes (/api/v1/workspaces/:workspaceId/tasks/:taskId)
 */
router.get(
  '/:workspaceId/tasks/:taskId',
  requireWorkspaceMember,
  (req, res, next) => taskController.getOne(req, res, next)
);

router.patch(
  '/:workspaceId/tasks/:taskId',
  requireWorkspaceMember,
  requireWorkspaceRole(['owner', 'admin', 'member']),
  validate({ body: updateTaskSchema }),
  (req, res, next) => taskController.update(req, res, next)
);

router.delete(
  '/:workspaceId/tasks/:taskId',
  requireWorkspaceMember,
  requireWorkspaceRole(['owner', 'admin', 'member']),
  (req, res, next) => taskController.delete(req, res, next)
);

/**
 * Task Comment Routes (/api/v1/workspaces/:workspaceId/tasks/:taskId/comments)
 */
router.get(
  '/:workspaceId/tasks/:taskId/comments',
  requireWorkspaceMember,
  (req, res, next) => commentController.list(req, res, next)
);

router.post(
  '/:workspaceId/tasks/:taskId/comments',
  requireWorkspaceMember,
  requireWorkspaceRole(['owner', 'admin', 'member']),
  validate({ body: createCommentSchema }),
  (req, res, next) => commentController.create(req, res, next)
);

router.delete(
  '/:workspaceId/tasks/:taskId/comments/:commentId',
  requireWorkspaceMember,
  requireWorkspaceRole(['owner', 'admin', 'member']),
  (req, res, next) => commentController.delete(req, res, next)
);

export default router;
