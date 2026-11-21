import { z } from 'zod';

/**
 * Workspace & Member Validation Schemas
 */

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(2, 'Workspace name must be at least 2 characters long').max(100),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,}$/, 'Workspace key must be at least 2 uppercase alphanumeric characters')
    .optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase letters, numbers, and hyphens')
    .min(2, 'Slug must be at least 2 characters long')
    .max(50, 'Slug cannot exceed 50 characters')
    .optional()
});

export const updateWorkspaceSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  key: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{2,}$/, 'Workspace key must be at least 2 uppercase alphanumeric characters')
    .optional(),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must consist of lowercase letters, numbers, and hyphens')
    .min(2)
    .max(50)
    .optional()
});

export const addMemberSchema = z.object({
  email: z.string().trim().email('Invalid email address').toLowerCase(),
  role: z.enum(['admin', 'member', 'viewer']).default('member')
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['admin', 'member', 'viewer'], {
    message: 'Role must be admin, member, or viewer'
  })
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type UpdateWorkspaceInput = z.infer<typeof updateWorkspaceSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
