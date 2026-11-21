import { Schema, model, Document, Types } from 'mongoose';

/**
 * Refresh Token Interface
 */
export interface IRefreshToken extends Document {
  userId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

/**
 * Refresh Token Mongoose Schema
 * 
 * Design Decisions:
 * 1. Stores a SHA-256 hash of the refresh token to prevent plaintext token compromise.
 * 2. TTL (Time-To-Live) index on `expiresAt` automatically purges expired tokens from MongoDB.
 * 3. Tied to `userId` so that users can view or revoke active sessions.
 */
const refreshTokenSchema = new Schema<IRefreshToken>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    tokenHash: {
      type: String,
      required: true,
      unique: true
    },
    expiresAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

// TTL index: MongoDB background worker removes documents once expiresAt has passed
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const RefreshToken = model<IRefreshToken>('RefreshToken', refreshTokenSchema);
