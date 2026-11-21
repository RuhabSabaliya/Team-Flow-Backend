import { Schema, model, Document, Types } from 'mongoose';
import { WorkspaceRole } from './WorkspaceMember';

export interface IWorkspaceInvitation extends Document {
  workspaceId: Types.ObjectId;
  email: string;
  role: WorkspaceRole;
  invitedBy: Types.ObjectId;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: Date;
  updatedAt: Date;
}

const workspaceInvitationSchema = new Schema<IWorkspaceInvitation>(
  {
    workspaceId: {
      type: Schema.Types.ObjectId,
      ref: 'Workspace',
      required: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'viewer'],
      default: 'member',
      required: true
    },
    invitedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'declined'],
      default: 'pending',
      index: true
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

workspaceInvitationSchema.index({ workspaceId: 1, email: 1, status: 1 });

export const WorkspaceInvitation = model<IWorkspaceInvitation>('WorkspaceInvitation', workspaceInvitationSchema);
