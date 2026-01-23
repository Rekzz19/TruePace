import { z } from "zod";

export const stepTwoSchema = z.object({
    experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"]),
    runningGoal: z.enum(["STAY_ACTIVE", "TARGET_2K", "TARGET_5K", "TARGET_10K", "TARGET_MARATHON"]),
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
