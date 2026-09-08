import { z } from "zod";

export const parsedTaskItemSchema = z.object({
  title: z.string().trim().min(1).max(200),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dueTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  estimatedMinutes: z.number().int().positive().optional(),
});

export const parsedBrainDumpSchema = z.object({
  items: z.array(parsedTaskItemSchema).max(50),
});

export const brainDumpInputSchema = z.object({
  text: z.string().trim().min(1, "Nothing to work with yet.").max(4000),
});
