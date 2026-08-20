import { z } from "zod";

export const iocSubmissionSchema = z.object({
  type: z.enum(["ip", "domain", "url", "hash"], {
    errorMap: () => ({ message: "Choose an indicator type" }),
  }),
  value: z
    .string()
    .trim()
    .min(3, "Enter a value to submit")
    .max(2048, "Keep the value under 2048 characters"),
  notes: z.string().trim().max(1000, "Keep notes under 1000 characters").optional(),
});
export type IOCSubmissionFormInput = z.infer<typeof iocSubmissionSchema>;
