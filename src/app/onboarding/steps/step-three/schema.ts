import { z } from "zod";

export const stepThreeSchema = z.object({
    username: z.string()
    .min(2, "Username is too short")
    .max(20, "Nickname is too long")
    .regex(/^[a-zA-Z][a-zA-Z0-9]*$/, {
        message: "Nickname must start with a letter and contain only letters and numbers",
    }),
});

export type stepThreeValues = z.infer<typeof stepThreeSchema>