import bcrypt from 'bcrypt';

/**
 * Password Security Utility
 * 
 * Uses bcrypt with a salt cost factor of 10.
 */
const SALT_ROUNDS = 10;

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}
