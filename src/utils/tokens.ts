import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../config/env';

/**
 * JWT User Payload Interface
 */
export interface JwtUserPayload {
  userId: string;
  email: string;
  jti?: string;
}

/**
 * Generates a short-lived Access Token (default 15m)
 */
export function generateAccessToken(payload: JwtUserPayload): string {
  return jwt.sign(
    { userId: payload.userId, email: payload.email },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as any }
  );
}

/**
 * Generates a long-lived Refresh Token (default 7d)
 * Includes a cryptographic UUID (jti - JWT ID claim) to ensure uniqueness
 * even if multiple tokens are minted in the same second.
 */
export function generateRefreshToken(payload: JwtUserPayload): string {
  return jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      jti: crypto.randomUUID()
    },
    env.JWT_REFRESH_SECRET,
    { expiresIn: env.REFRESH_TOKEN_EXPIRES_IN as any }
  );
}

/**
 * Verifies and decodes an Access Token
 */
export function verifyAccessToken(token: string): JwtUserPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtUserPayload;
}

/**
 * Verifies and decodes a Refresh Token
 */
export function verifyRefreshToken(token: string): JwtUserPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtUserPayload;
}

/**
 * Hashes a refresh token string with SHA-256 before saving to MongoDB
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
