import { z } from "zod";

export const signUpSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export const signInSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Enter your password."),
});

export const magicLinkSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

export const updatePasswordSchema = z.object({
  password: z.string().min(8, "Use at least 8 characters."),
});

export const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1, "Enter a name.").max(80),
  timezone: z.string().min(1, "Choose a timezone."),
});
