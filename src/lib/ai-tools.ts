import { z } from "zod";

export const rescheduleWorkout = {
  description:
    "Reschedule a workout to a different date based on user request or constraints",
  parameters: z.object({
    workoutId: z.string().describe("ID of workout to reschedule"),
    newDate: z.string().describe("New date (YYYY-MM-DD)"),
    reason: z.string().describe("Why this reschedule is needed"),
    preserveIntensity: z
      .boolean()
      .default(true)
      .describe("Keep the same intensity level"),
  }),
  inputSchema: z.object({
    workoutId: z.string(),
    newDate: z.string(),
    reason: z.string(),
    preserveIntensity: z.boolean().optional(),
  }),
};

export const adaptTrainingPlan = {
  description:
    "Adjust training based on performance patterns, fatigue, or user feedback",
  parameters: z.object({
    adjustmentType: z
      .enum([
        "reduce_intensity",
        "add_rest",
        "extend_plan",
        "increase_intensity",
      ])
      .describe("Type of adjustment needed"),
    reason: z.string().describe("Why adaptation is needed"),
    duration: z.number().describe("Days to apply adjustment"),
    targetWorkouts: z
      .array(z.string())
      .optional()
      .describe("Specific workout IDs to target (optional)"),
  }),
  inputSchema: z.object({
    adjustmentType: z.enum([
      "reduce_intensity",
      "add_rest",
      "extend_plan",
      "increase_intensity",
    ]),
    reason: z.string(),
    duration: z.number(),
    targetWorkouts: z.array(z.string()).optional(),
  }),
};

export const handleInjuryResponse = {
  description: "Modify training plan due to injury or pain reported by user",
  parameters: z.object({
    injuryType: z
      .enum(["acute_pain", "chronic_discomfort", "fatigue", "overtraining"])
      .describe("Type of injury/fatigue"),
    affectedArea: z.string().describe("Body part affected or general fatigue"),
    severity: z.enum(["mild", "moderate", "severe"]).describe("Severity level"),
    action: z
      .enum([
        "rest_only",
        "cross_train",
        "medical_attention",
        "reduce_intensity",
      ])
      .describe("Recommended action"),
  }),
  inputSchema: z.object({
    injuryType: z.enum([
      "acute_pain",
      "chronic_discomfort",
      "fatigue",
      "overtraining",
    ]),
    affectedArea: z.string(),
    severity: z.enum(["mild", "moderate", "severe"]),
    action: z.enum([
      "rest_only",
      "cross_train",
      "medical_attention",
      "reduce_intensity",
    ]),
  }),
};

export const generateNextWeek = {
  description: "Generate next week of training based on performance analysis",
  parameters: z.object({
    performanceAnalysis: z.object({
      completionRate: z.number().describe("Percentage of completed runs"),
      averageRpe: z.number().describe("Average effort rating"),
      injuryReports: z.number().describe("Number of injury reports"),
      targetWeeks: z
        .number()
        .default(2)
        .describe("Number of weeks to generate"),
    }),
    maintainProgression: z
      .boolean()
      .default(true)
      .describe("Maintain training progression"),
  }),
  inputSchema: z.object({
    performanceAnalysis: z.object({
      completionRate: z.number(),
      averageRpe: z.number(),
      injuryReports: z.number(),
      targetWeeks: z.number().optional(),
    }),
    maintainProgression: z.boolean().optional(),
  }),
};

export const updateWorkoutParameters = {
  description:
    "Intelligently adjust workout parameters based on user feedback and context",
  parameters: z.object({
    workoutId: z.string().describe("The ID of the workout to modify"),
    userFeedback: z
      .string()
      .describe(
        "User's feedback about how they feel or what they want to change",
      ),
    adjustmentIntent: z
      .enum(["decrease", "increase", "maintain"])
      .describe("Whether to decrease, increase, or maintain intensity"),
    context: z
      .string()
      .optional()
      .describe("Additional context about the user's situation"),
    targetDate: z
      .string()
      .optional()
      .describe("New date if rescheduling is needed"),
  }),
  inputSchema: z.object({
    workoutId: z.string(),
    userFeedback: z.string(),
    adjustmentIntent: z.enum(["decrease", "increase", "maintain"]),
    context: z.string().optional(),
    targetDate: z.string().optional(),
  }),
};
