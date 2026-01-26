import { z } from "zod";

// Login schema for validation
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Invalid Password"),
});

export type LoginValues = z.infer<typeof loginSchema>;