import { Schema, model, Document, Types } from 'mongoose';

/**
 * Workspace Entity Interface
 */
export interface IWorkspace extends Document {
  name: string;
  slug: string;
  key?: string;
  ownerId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Workspace Mongoose Schema
 * 
 * Design Decisions:
 * 1. slug: unique index, lowercase, URL-friendly identifier.
 * 2. key: optional uppercase alphanumeric identifier, minimum 2 characters (no arbitrary max 5-character limit).
 * 3. ownerId: references User collection to denote the ultimate authority.
 * 4. timestamps: createdAt and updatedAt.
 */
const workspaceSchema = new Schema<IWorkspace>(
  {
    name: {
      type: String,
      required: [true, 'Workspace name is required'],
      trim: true,
      minlength: [2, 'Workspace name must be at least 2 characters long'],
      maxlength: [100, 'Workspace name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'Workspace slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase letters, numbers, and hyphens']
    },
    key: {
      type: String,
      uppercase: true,
      trim: true,
      match: [/^[A-Z0-9]{2,}$/, 'Workspace key must be at least 2 uppercase alphanumeric characters']
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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

export const Workspace = model<IWorkspace>('Workspace', workspaceSchema);
