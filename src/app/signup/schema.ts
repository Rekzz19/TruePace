import { z } from "zod";

export const signupSchema = z.object({
  email: z.email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type SignupValues = z.infer<typeof signupSchema>;
export type SignupInput = z.input<typeof signupSchema>;
