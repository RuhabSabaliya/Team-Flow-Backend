import { Types } from 'mongoose';
import { Task, ITask } from '../models/Task';
import { Project } from '../models/Project';
import { NotFoundError, ValidationError } from '../utils/errors';
import { CreateTaskInput, UpdateTaskInput, ListTasksQuery } from '../validations/task.validation';

export class TaskService {
  /**
   * Create a new task within a project (atomic task sequence counter)
   */
  public async createTask(
    workspaceId: Types.ObjectId,
    projectId: string,
    userId: string,
    input: CreateTaskInput
  ): Promise<ITask> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new ValidationError('Invalid project ID format');
    }

    // Atomically increment project's taskSequence to guarantee unique sequential numbers
    const project = await Project.findOneAndUpdate(
      { _id: new Types.ObjectId(projectId), workspaceId },
      { $inc: { taskSequence: 1 } },
      { new: true }
    );

    if (!project) {
      throw new NotFoundError('Project not found in this workspace');
    }

    const taskNumber = project.taskSequence;
    const key = `${project.key}-${taskNumber}`;

    const task = await Task.create({
      title: input.title,
      description: input.description,
      status: input.status,
      priority: input.priority,
      taskNumber,
      key,
      workspaceId,
      projectId: project._id,
      assigneeId: input.assigneeId ? new Types.ObjectId(input.assigneeId) : undefined,
      creatorId: new Types.ObjectId(userId),
      dueDate: input.dueDate ? new Date(input.dueDate) : undefined
    });

    return task;
  }

  /**
   * List tasks within a project with optional filters (status, priority, assigneeId)
   */
  public async listProjectTasks(
    workspaceId: Types.ObjectId,
    projectId: string,
    query: ListTasksQuery
  ) {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new ValidationError('Invalid project ID format');
    }

    const filter: Record<string, any> = {
      workspaceId,
      projectId: new Types.ObjectId(projectId)
    };

    if (query.status) filter.status = query.status;
    if (query.priority) filter.priority = query.priority;
    if (query.assigneeId) filter.assigneeId = new Types.ObjectId(query.assigneeId);

    return Task.find(filter)
      .populate('assigneeId', 'name email')
      .populate('creatorId', 'name email')
      .sort({ taskNumber: -1 });
  }

  /**
   * Get single task by ID (workspace scoped)
   */
  public async getTaskById(workspaceId: Types.ObjectId, taskId: string): Promise<ITask> {
    if (!Types.ObjectId.isValid(taskId)) {
      throw new ValidationError('Invalid task ID format');
    }

    const task = await Task.findOne({ _id: new Types.ObjectId(taskId), workspaceId })
      .populate('assigneeId', 'name email')
      .populate('creatorId', 'name email')
      .populate('projectId', 'name key');

    if (!task) {
      throw new NotFoundError('Task not found in this workspace');
    }

    return task;
  }

  /**
   * Update task details (status, priority, assignee, etc.)
   */
  public async updateTask(
    workspaceId: Types.ObjectId,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<ITask> {
    const task = await this.getTaskById(workspaceId, taskId);

    if (input.title !== undefined) task.title = input.title;
    if (input.description !== undefined) task.description = input.description;
    if (input.status !== undefined) task.status = input.status;
    if (input.priority !== undefined) task.priority = input.priority;
    if (input.assigneeId !== undefined) {
      task.assigneeId = input.assigneeId ? new Types.ObjectId(input.assigneeId) : undefined;
    }
    if (input.dueDate !== undefined) {
      task.dueDate = input.dueDate ? new Date(input.dueDate) : undefined;
    }

    await task.save();
    await task.populate('assigneeId', 'name email');
    await task.populate('creatorId', 'name email');
    return task;
  }

  /**
   * Delete a task
   */
  public async deleteTask(workspaceId: Types.ObjectId, taskId: string): Promise<void> {
    const task = await this.getTaskById(workspaceId, taskId);
    await Task.deleteOne({ _id: task._id });
  }
}

export const taskService = new TaskService();
