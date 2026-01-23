import { z } from "zod";

export const stepTwoSchema = z.object({
    experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"]),
    runningGoal: z.enum(["TWO-KM", "FIVE-KM", "TEN-KM", "MARATHON"]),
    availability: z.array(z.enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ])
    ).min(1, "Select at least one day"),
    injuryHistory: z.string().optional(),

});

export type stepTwoValues = z.infer<typeof stepTwoSchema>

export type stepTwoInput = z.input<typeof stepTwoSchema>
