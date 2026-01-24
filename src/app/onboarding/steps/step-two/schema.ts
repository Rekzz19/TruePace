import { z } from "zod";

export const stepTwoSchema = z.object({
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"],{
    message: "Please select your experience level"
  }),
  runningGoal: z.enum(["STAY_ACTIVE", "TARGET_2K", "TARGET_5K", "TARGET_10K", "TARGET_MARATHON"],{
    message: "Please select your running goal"
  }),
  availability: z.array(z.enum([
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ])
  ).min(1, "Select at least one day").default([]),

  injuryHistory: z.string(),

});

export type stepTwoValues = z.infer<typeof stepTwoSchema>

export type stepTwoInput = z.input<typeof stepTwoSchema>

//      