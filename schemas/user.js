import { z } from "zod";

// Base user schema without password requirements
export const UserBaseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Please enter a valid email address"),
  role: z.enum(["Admin", "User", "Customer"], {
    errorMap: () => ({ message: "Please select a valid role" }),
  }),
  status: z.enum(["Active", "Inactive"], {
    errorMap: () => ({ message: "Status must be either Active or Inactive" }),
  }),
  isVerified: z.boolean().default(true),
  isTwoFactorEnabled: z.boolean().default(false),
  image: z.string().optional(), // Optional image
});

// Schema for creating a new user (requires password)
export const CreateUserSchema = UserBaseSchema.extend({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
});

// Schema for updating an existing user (password optional)
export const UpdateUserSchema = UserBaseSchema.extend({
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
});


export const UpdatePasswordSchema = z.object({
  id: z.string().min(1, "User ID is required"),
  currentPassword: z.string().min(1, "Current password is required"),
newPassword: z.string()
  .min(8, "Password must be 8-20 characters with uppercase, lowercase, number, and special character (no spaces)")
  .max(20, "Password must be 8-20 characters with uppercase, lowercase, number, and special character (no spaces)"),
  confirmPassword: z.string().min(1, "Please confirm your password")
}).strict().refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"]
  }
);