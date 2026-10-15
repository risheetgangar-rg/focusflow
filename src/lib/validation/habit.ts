import { z } from "zod";

export const habitFormSchema = z.object({
  name: z.string().trim().min(1, "Give it a name.").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  color: z.string().min(1),
  targetCount: z.coerce.number().int().min(1).max(7),
  reminderEnabled: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()).default(false),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional()
    .or(z.literal("")),
});

export type HabitFormValues = z.infer<typeof habitFormSchema>;
