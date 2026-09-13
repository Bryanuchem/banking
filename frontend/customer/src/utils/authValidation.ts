import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.");

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
});

export const registerSchema = z
  .object({
    first_name: z.string().trim().min(1, "Enter your first name."),
    last_name: z.string().trim().min(1, "Enter your last name."),
    email: emailSchema,
    phone: z.string().trim().min(6, "Enter a valid phone number."),
    password: z.string().min(8, "Use at least 8 characters."),
    confirm_password: z.string(),
  })
  .refine(
    (value) => value.password === value.confirm_password,
    {
      path: ["confirm_password"],
      message: "Passwords do not match.",
    },
  );

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z
  .object({
    email: emailSchema,
    code: z
      .string()
      .trim()
      .min(4, "Enter the recovery code."),
    new_password: z.string().min(8, "Use at least 8 characters."),
    confirm_password: z.string(),
  })
  .refine(
    (value) => value.new_password === value.confirm_password,
    {
      path: ["confirm_password"],
      message: "Passwords do not match.",
    },
  );

export type FieldErrors = Record<string, string>;

export function zodFieldErrors(
  error: z.ZodError,
): FieldErrors {
  const result: FieldErrors = {};

  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "form");
    if (!result[field]) {
      result[field] = issue.message;
    }
  }

  return result;
}
