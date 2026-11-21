import { Types } from 'mongoose';
import { Project, IProject } from '../models/Project';
import { Task } from '../models/Task';
import { generateProjectKey } from '../utils/projectKey';
import { ConflictError, NotFoundError, ValidationError } from '../utils/errors';
import { CreateProjectInput, UpdateProjectInput } from '../validations/project.validation';

export class ProjectService {
  /**
   * Create a project within a workspace
   */
  public async createProject(
    workspaceId: Types.ObjectId,
    userId: string,
    input: CreateProjectInput
  ): Promise<IProject> {
    let key: string;

    if (input.key) {
      const existing = await Project.findOne({ workspaceId, key: input.key });
      if (existing) {
        throw new ConflictError(`Project with key '${input.key}' already exists in this workspace`);
      }
      key = input.key;
    } else {
      key = await generateProjectKey(input.name, workspaceId);
    }

    const project = await Project.create({
      name: input.name,
      key,
      description: input.description,
      workspaceId,
      creatorId: new Types.ObjectId(userId)
    });

    return project;
  }

  /**
   * List all projects in a workspace
   */
  public async listProjects(workspaceId: Types.ObjectId) {
    return Project.find({ workspaceId }).sort({ createdAt: -1 });
  }

  /**
   * Get project by ID (scoped to workspace)
   */
  public async getProjectById(workspaceId: Types.ObjectId, projectId: string): Promise<IProject> {
    if (!Types.ObjectId.isValid(projectId)) {
      throw new ValidationError('Invalid project ID format');
    }

    const project = await Project.findOne({ _id: new Types.ObjectId(projectId), workspaceId });
    if (!project) {
      throw new NotFoundError('Project not found in this workspace');
    }

    return project;
  }

  /**
   * Update project details
   */
  public async updateProject(
    workspaceId: Types.ObjectId,
    projectId: string,
    input: UpdateProjectInput
  ): Promise<IProject> {
    const project = await this.getProjectById(workspaceId, projectId);

    if (input.name) project.name = input.name;
    if (input.description !== undefined) project.description = input.description;

    await project.save();
    return project;
  }

  /**
   * Delete project and cascade-delete all its tasks
   */
  public async deleteProject(workspaceId: Types.ObjectId, projectId: string): Promise<void> {
    const project = await this.getProjectById(workspaceId, projectId);

    // Cascade delete all tasks belonging to this project
    await Task.deleteMany({ projectId: project._id });
    await Project.deleteOne({ _id: project._id });
  }
}

export const projectService = new ProjectService();
