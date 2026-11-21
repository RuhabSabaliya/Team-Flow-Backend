import crypto from 'crypto';
import { Workspace } from '../models/Workspace';

/**
 * Slug Generator Utility
 * 
 * Purpose:
 * Transforms a human-readable title/name into a URL-friendly kebab-case slug.
 * If slug collisions exist in the database, appends a short random alphanumeric suffix.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start
    .replace(/-+$/, '');            // Trim - from end
}

/**
 * Generate a unique slug for a workspace, appending a random suffix if taken
 */
export async function generateUniqueWorkspaceSlug(baseName: string): Promise<string> {
  let baseSlug = slugify(baseName);
  if (!baseSlug) {
    baseSlug = 'workspace';
  }

  // Check if baseSlug is available
  const existing = await Workspace.findOne({ slug: baseSlug });
  if (!existing) {
    return baseSlug;
  }

  // If collision occurs, generate slug with short random suffix
  while (true) {
    const suffix = crypto.randomBytes(3).toString('hex'); // 6 hex characters
    const candidate = `${baseSlug}-${suffix}`;
    const collision = await Workspace.findOne({ slug: candidate });
    if (!collision) {
      return candidate;
    }
  }
}
