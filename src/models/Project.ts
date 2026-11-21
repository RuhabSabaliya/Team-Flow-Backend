import { Schema, model, Document, Types } from 'mongoose';

/**
 * Project Entity Interface
 */
export interface IProject extends Document {
  name: string;
  key: string;
  description?: string;
  workspaceId: Types.ObjectId;
  creatorId: Types.ObjectId;
  taskSequence: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Project Mongoose Schema
 * 
 * Design Decisions:
 * 1. key: minimum 2 uppercase alphanumeric characters (no arbitrary max 5-character limit).
 * 2. Compound unique index: { workspaceId: 1, key: 1 } ensures keys are unique per workspace.
 * 3. taskSequence: Atomic counter incremented whenever a new task is created (1, 2, 3...).
 */
const projectSchema = new Schema<IProject>(
  {
    name: {
      type: String,
      required: [true, 'Project name is required'],
      trim: true,
      minlength: [2, 'Project name must be at least 2 characters long'],
      maxlength: [100, 'Project name cannot exceed 100 characters']
    },
    key: {
      type: String,
      required: [true, 'Project key is required'],
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{2,}$/, 'Project key must be at least 2 uppercase alphanumeric characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    creatorId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    taskSequence: {
      type: Number,
      default: 0
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

// Compound unique index ensuring project keys are unique within a given workspace
projectSchema.index({ workspaceId: 1, key: 1 }, { unique: true });

export const Project = model<IProject>('Project', projectSchema);
