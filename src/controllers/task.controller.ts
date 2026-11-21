import { Request, Response, NextFunction } from 'express';
import { taskService } from '../services/task.service';

export class TaskController {
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
      const task = await taskService.createTask(
        req.workspace!._id as any,
        projectId,
        req.user!.userId,
        req.body
      );
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
      const tasks = await taskService.listProjectTasks(
        req.workspace!._id as any,
        projectId,
        req.query as any
      );
      res.status(200).json(tasks);
    } catch (error) {
      next(error);
    }
  }

  public async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
      const task = await taskService.getTaskById(req.workspace!._id as any, taskId);
      res.status(200).json(task);
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
      const updated = await taskService.updateTask(req.workspace!._id as any, taskId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = Array.isArray(req.params.taskId) ? req.params.taskId[0] : req.params.taskId;
      await taskService.deleteTask(req.workspace!._id as any, taskId);
      res.status(200).json({ message: 'Task deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const taskController = new TaskController();
