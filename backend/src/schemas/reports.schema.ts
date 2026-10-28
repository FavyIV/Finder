import { z } from 'zod';
import { ReportStatus } from '@prisma/client';

export const createReportSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(5, 'Reason must be at least 5 characters long')
    .max(500, 'Reason must not exceed 500 characters'),
});

export type CreateReportInput = z.infer<typeof createReportSchema>;

export const listAdminReportsSchema = z.object({
  status: z.nativeEnum(ReportStatus).default(ReportStatus.PENDING),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
});

export type ListAdminReportsInput = z.infer<typeof listAdminReportsSchema>;

export const resolveReportSchema = z
  .object({
    action: z.enum([ReportStatus.DISMISSED, ReportStatus.REMOVED]).optional(),
    status: z.enum([ReportStatus.DISMISSED, ReportStatus.REMOVED]).optional(),
  })
  .refine((data) => data.action !== undefined || data.status !== undefined, {
    message: 'Either action or status must be provided (DISMISSED or REMOVED).',
  })
  .transform((data) => ({
    status: (data.status ?? data.action) as
      typeof ReportStatus.DISMISSED | typeof ReportStatus.REMOVED,
  }));

export type ResolveReportInput = z.infer<typeof resolveReportSchema>;
