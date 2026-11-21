import { Schema, model, Document } from 'mongoose';

/**
 * User Entity Interface
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * User Mongoose Schema
 * 
 * Design Decisions:
 * 1. email: Lowercase, trimmed, unique index for clean lookups.
 * 2. password: select: false prevents accidental leakage in database queries/serialization.
 * 3. timestamps: Automatically manages createdAt and updatedAt.
 */
const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false // Never return password hash in queries unless explicitly requested
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret: Record<string, any>) => {
        delete ret.password;
        delete ret.__v;
        ret.id = ret._id;
        delete ret._id;
        return ret;
      }
    }
  }
);

export const User = model<IUser>('User', userSchema);
