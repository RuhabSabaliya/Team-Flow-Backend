import { Request, Response, NextFunction } from 'express';
import { commentService } from '../services/comment.service';
import { Types } from 'mongoose';

const getParam = (param: string | string[] | undefined): string => {
  if (Array.isArray(param)) return param[0];
  return param || '';
};

export class CommentController {
  public async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspace!._id as unknown as Types.ObjectId;
      const taskId = getParam(req.params.taskId);
      const comments = await commentService.listComments(workspaceId, taskId);
      res.status(200).json(comments);
    } catch (error) {
      next(error);
    }
  }

  public async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspace!._id as unknown as Types.ObjectId;
      const taskId = getParam(req.params.taskId);
      const userId = req.user!.userId;
      const comment = await commentService.createComment(workspaceId, taskId, userId, req.body);
      res.status(201).json(comment);
    } catch (error) {
      next(error);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const workspaceId = req.workspace!._id as unknown as Types.ObjectId;
      const taskId = getParam(req.params.taskId);
      const commentId = getParam(req.params.commentId);
      const userId = req.user!.userId;
      const userRole = req.membership?.role || 'member';
      await commentService.deleteComment(workspaceId, taskId, commentId, userId, userRole);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const commentController = new CommentController();
