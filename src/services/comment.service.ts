import { Types } from 'mongoose';
import { Comment, IComment } from '../models/Comment';
import { Task } from '../models/Task';
import { NotFoundError, ForbiddenError } from '../utils/errors';
import { CreateCommentInput } from '../validations/comment.validation';

export class CommentService {
  /**
   * List all comments for a task
   */
  public async listComments(workspaceId: Types.ObjectId, taskId: string) {
    const task = await Task.findOne({ _id: taskId, workspaceId });
    if (!task) {
      throw new NotFoundError('Task not found in this workspace');
    }

    const comments = await Comment.find({ taskId: task._id, workspaceId })
      .populate('userId', 'name email')
      .sort({ createdAt: 1 });

    return comments;
  }

  /**
   * Create a comment on a task
   */
  public async createComment(
    workspaceId: Types.ObjectId,
    taskId: string,
    userId: string,
    input: CreateCommentInput
  ): Promise<IComment> {
    const task = await Task.findOne({ _id: taskId, workspaceId });
    if (!task) {
      throw new NotFoundError('Task not found in this workspace');
    }

    const comment = await Comment.create({
      taskId: task._id,
      workspaceId,
      userId: new Types.ObjectId(userId),
      content: input.content
    });

    await comment.populate('userId', 'name email');
    return comment;
  }

  /**
   * Delete a comment (author, workspace owner, or admin)
   */
  public async deleteComment(
    workspaceId: Types.ObjectId,
    taskId: string,
    commentId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const comment = await Comment.findOne({
      _id: commentId,
      taskId,
      workspaceId
    });

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    const isAuthor = comment.userId.toString() === userId;
    const isElevated = userRole === 'owner' || userRole === 'admin';

    if (!isAuthor && !isElevated) {
      throw new ForbiddenError('You can only delete your own comments');
    }

    await Comment.deleteOne({ _id: comment._id });
  }
}

export const commentService = new CommentService();
