import { Schema, model, Document, Types } from 'mongoose';

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

/**
 * Workspace Member Interface
 */
export interface IWorkspaceMember extends Document {
  workspaceId: Types.ObjectId;
  userId: Types.ObjectId;
  role: WorkspaceRole;
  joinedAt: Date;
  updatedAt: Date;
}

/**
 * Workspace Member Schema (Referenced Many-to-Many)
 * 
 * Design Decisions:
 * 1. Compound Unique Index on { workspaceId: 1, userId: 1 }:
 *    Guarantees a user cannot be added to the same workspace more than once.
 * 2. Dedicated collection:
 *    Ensures unlimited members per workspace without MongoDB document size bloat.
 */
const workspaceMemberSchema = new Schema<IWorkspaceMember>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      required: true,
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
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

// Compound unique index for membership isolation
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export const WorkspaceMember = model<IWorkspaceMember>('WorkspaceMember', workspaceMemberSchema);
