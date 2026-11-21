import { Schema, model, Document, Types } from 'mongoose';

export type TaskStatus = 'backlog' | 'todo' | 'in_progress' | 'in_review' | 'on_hold' | 'done' | 'canceled';
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low' | 'none';

/**
 * Task Entity Interface
 */
export interface ITask extends Document {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  taskNumber: number;
  key: string;
  workspaceId: Types.ObjectId;
  projectId: Types.ObjectId;
  assigneeId?: Types.ObjectId;
  creatorId: Types.ObjectId;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Task Mongoose Schema
 * 
 * Design Decisions:
 * 1. status: 7 confirmed states (backlog, todo, in_progress, in_review, on_hold, done, canceled).
 * 2. priority: 5 confirmed levels (urgent, high, medium, low, none).
 * 3. key: human-friendly identifier (e.g. "TF-1", "TF-2").
 * 4. workspaceId & projectId indexes for fast, isolated tenant queries.
 */
const taskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [1, 'Task title cannot be empty'],
      maxlength: [200, 'Task title cannot exceed 200 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [50000, 'Description cannot exceed 50000 characters']
    },
    status: {
      type: String,
      enum: ['backlog', 'todo', 'in_progress', 'in_review', 'on_hold', 'done', 'canceled'],
      default: 'todo',
      index: true
    },
    priority: {
      type: String,
      enum: ['urgent', 'high', 'medium', 'low', 'none'],
      default: 'none',
      index: true
    },
    taskNumber: {
      type: Number,
      required: true
    },
    key: {
      type: String,
      required: true,
      index: true
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    projectId: {
      type: Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    assigneeId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dueDate: {
      type: Date
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

// Compound indexes for common dashboard & Kanban board queries
taskSchema.index({ projectId: 1, status: 1 });
taskSchema.index({ workspaceId: 1, assigneeId: 1 });

export const Task = model<ITask>('Task', taskSchema);
