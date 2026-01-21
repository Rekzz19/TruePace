import { z } from "zod";

export const stepOneSchema = z.object({
    fullName: z.string().min(1),
    age: z.coerce.number().min(15, "Age should be greater than 15"),
    weight: z.coerce.number().min(1, "Enter your weight"),
    height: z.coerce.number().min(1, "Enter your height"),
});

export type stepOneValues = z.infer<typeof stepOneSchema> //type after validation describes the clean, validated data coming out of Zod.
export type stepOneInput = z.input<typeof stepOneSchema>//type before validation, describes the raw form data coming in
