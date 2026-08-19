import { z } from "zod";

const TYPES = ["security_summary", "incident_report", "threat_intelligence", "risk_report", "activity_report"] as const;

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  type: z.enum(TYPES).optional(),
  search: z.string().trim().max(200).optional(),
});
export type ReportListQuery = z.infer<typeof listQuerySchema>;

export const createSchema = z
  .object({
    type: z.enum(TYPES),
    title: z.string().trim().min(2).max(200),
    periodStart: z.string().datetime({ offset: true }),
    periodEnd: z.string().datetime({ offset: true }),
  })
  .refine((data) => new Date(data.periodStart).getTime() <= new Date(data.periodEnd).getTime(), {
    message: "periodEnd must be on or after periodStart",
    path: ["periodEnd"],
  });
export type CreateReportInput = z.infer<typeof createSchema>;
