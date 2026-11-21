import { Request, Response, NextFunction } from 'express';
import { projectService } from '../services/project.service';

export class ProjectController {
  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await projectService.createProject(
        req.workspace!._id as any,
        req.user!.userId,
        req.body
      );
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }

  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await projectService.listProjects(req.workspace!._id as any);
      res.status(200).json(projects);
    } catch (error) {
      next(error);
    }
  }

  public async getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
      const project = await projectService.getProjectById(req.workspace!._id as any, projectId);
      res.status(200).json(project);
    } catch (error) {
      next(error);
    }
  }

  public async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
      const updated = await projectService.updateProject(req.workspace!._id as any, projectId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId;
      await projectService.deleteProject(req.workspace!._id as any, projectId);
      res.status(200).json({ message: 'Project and all associated tasks deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const projectController = new ProjectController();
