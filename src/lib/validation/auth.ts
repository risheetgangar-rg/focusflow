import { z } from "zod";
import { THEMES } from "@/lib/gamification/rules";
import { isValidTimezone } from "@/lib/dates/tz";

export const signUpSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export const signInSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const magicLinkSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email."),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters."),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, "What should we call you?").max(80),
  timezone: z.string().refine(isValidTimezone, "Pick a timezone from the list."),
});

export const gamificationModeSchema = z.enum(["off", "light", "full"]);

export const themeSchema = z.enum(THEMES.map((t) => t.id) as [string, ...string[]]);

export const onboardingSchema = z.object({
  displayName: z.string().trim().max(80).optional().or(z.literal("")),
  focusAreas: z.array(z.enum(["bills", "work", "calls", "home", "health", "remembering", "starting", "focus", "habits", "all"])).max(5),
  gamificationMode: gamificationModeSchema,
  timezone: z.string().refine(isValidTimezone).optional(),
});
