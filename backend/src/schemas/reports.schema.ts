import { z } from 'zod';

export const createReportSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Reason must be at least 5 characters long')
    .max(500, 'Reason must not exceed 500 characters'),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
