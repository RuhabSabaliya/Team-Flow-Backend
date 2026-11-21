import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().trim().max(50000).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'on_hold', 'done', 'canceled']).default('todo'),
  priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).default('none'),
  assigneeId: z.string().optional(),
  dueDate: z.string().datetime().optional()
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(50000).optional(),
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'on_hold', 'done', 'canceled']).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional()
});

export const listTasksQuerySchema = z.object({
  status: z.enum(['backlog', 'todo', 'in_progress', 'in_review', 'on_hold', 'done', 'canceled']).optional(),
  priority: z.enum(['urgent', 'high', 'medium', 'low', 'none']).optional(),
  assigneeId: z.string().optional()
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
