import { z } from "zod";

export const taskFormSchema = z.object({
  title: z.string().trim().min(1, "Enter a title.").max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
  importance: z.coerce.number().int().min(1).max(5).default(3),
  urgency: z.coerce.number().int().min(1).max(5).default(3),
  friction: z.coerce.number().int().min(1).max(5).default(1),
  estimatedMinutes: z.coerce.number().int().positive().optional().or(z.literal("")),
  dueDate: z.string().optional().or(z.literal("")),
  dueTime: z.string().optional().or(z.literal("")),
  scheduledDate: z.string().optional().or(z.literal("")),
  scheduledTime: z.string().optional().or(z.literal("")),
  recurrenceRule: z.enum(["none", "daily", "weekly", "monthly"]).default("none"),
});

export type TaskFormValues = z.infer<typeof taskFormSchema>;

export const subtaskTitleSchema = z.string().trim().min(1, "Enter a step.").max(200);
