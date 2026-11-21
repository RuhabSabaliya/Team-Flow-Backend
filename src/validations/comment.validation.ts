import { z } from 'zod';

export const createCommentSchema = z.object({
  content: z.string().trim().min(1, 'Comment cannot be empty').max(10000, 'Comment cannot exceed 10000 characters')
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;
