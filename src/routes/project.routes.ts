import { Router } from 'express';
import { projectController } from '../controllers/project.controller';
import { taskController } from '../controllers/task.controller';
import { requireWorkspaceRole } from '../middlewares/tenant';
import { validate } from '../middlewares/validate';
import { createProjectSchema, updateProjectSchema } from '../validations/project.validation';
import { createTaskSchema, listTasksQuerySchema } from '../validations/task.validation';

const router = Router({ mergeParams: true });

/**
 * Project Routes (Mounted under /api/v1/workspaces/:workspaceId/projects)
 */
router.post(
  '/',
  requireWorkspaceRole(['owner', 'admin', 'member']),
  validate({ body: createProjectSchema }),
  (req, res, next) => projectController.create(req, res, next)
);

router.get(
  '/',
  (req, res, next) => projectController.list(req, res, next)
);

router.get(
  '/:projectId',
  (req, res, next) => projectController.getOne(req, res, next)
);

router.patch(
  '/:projectId',
  requireWorkspaceRole(['owner', 'admin', 'member']),
  validate({ body: updateProjectSchema }),
  (req, res, next) => projectController.update(req, res, next)
);

router.delete(
  '/:projectId',
  requireWorkspaceRole(['owner', 'admin']),
  (req, res, next) => projectController.delete(req, res, next)
);

/**
 * Task Routes nested within Project (/projects/:projectId/tasks)
 */
router.post(
  '/:projectId/tasks',
  requireWorkspaceRole(['owner', 'admin', 'member']),
  validate({ body: createTaskSchema }),
  (req, res, next) => taskController.create(req, res, next)
);

router.get(
  '/:projectId/tasks',
  validate({ query: listTasksQuerySchema }),
  (req, res, next) => taskController.list(req, res, next)
);

export default router;
