import { Types } from 'mongoose';
import { Project } from '../models/Project';

/**
 * Generates an uppercase Project Key from the project name
 * Minimum length: 2 characters. No arbitrary 5-character limit.
 * Example: "TeamFlow Mobile" -> "TFM", "Platform Engineering Core" -> "PEC"
 */
export async function generateProjectKey(name: string, workspaceId: Types.ObjectId): Promise<string> {
  // Extract first letter of each word
  const words = name.trim().split(/\s+/).filter(Boolean);
  let candidate = '';

  if (words.length >= 2) {
    candidate = words.map(w => w[0]).join('').toUpperCase();
  } else if (words.length === 1 && words[0].length >= 2) {
    candidate = words[0].substring(0, Math.min(words[0].length, 6)).toUpperCase();
  } else {
    candidate = 'PRJ';
  }

  // Ensure candidate is at least 2 characters
  if (candidate.length < 2) {
    candidate = (candidate + 'X').substring(0, 2);
  }

  // Check collision in workspace
  let existing = await Project.findOne({ workspaceId, key: candidate });
  if (!existing) {
    return candidate;
  }

  // Append numeric suffix if collision occurs (e.g. TFM2, TFM3)
  for (let i = 2; i <= 99; i++) {
    const nextKey = `${candidate}${i}`;
    existing = await Project.findOne({ workspaceId, key: nextKey });
    if (!existing) {
      return nextKey;
    }
  }

  return `P${Date.now().toString().slice(-4)}`;
}
