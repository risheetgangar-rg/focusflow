import { z } from "zod";

export const habitFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a name.").max(120),
  description: z.string().trim().max(500).optional().or(z.literal("")),
  color: z.string().min(1),
  targetCount: z.coerce.number().int().min(1).max(7),
});

export type HabitFormValues = z.infer<typeof habitFormSchema>;
