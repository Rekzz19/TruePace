import { z } from "zod";

export const stepTwoSchema = z.object({
  experienceLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "PROFESSIONAL"],{
    message: "Please select your experience level"
  }),
  runningGoal: z.enum(["TWO-KM", "FIVE-KM", "TEN-KM", "MARATHON"],{
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
  ).min(1, "Select at least one day"),
  injuryHistory: z.string(),

});

export type stepTwoValues = z.infer<typeof stepTwoSchema>

export type stepTwoInput = z.input<typeof stepTwoSchema>

//      