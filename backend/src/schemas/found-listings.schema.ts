import { z } from 'zod';
import { Category } from '@prisma/client';

export const createFoundListingSchema = z.object({
  category: z.nativeEnum(Category, {
    errorMap: () => ({ message: 'Please select a valid item category' }),
  }),
  locationId: z.string().trim().min(1, 'Drop-off location is required'),
  foundAt: z.coerce.date().refine((date) => date <= new Date(), {
    message: 'Date and time found cannot be in the future',
  }),
  description: z
    .string()
    .trim()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional(),
});

export type CreateFoundListingInput = z.infer<typeof createFoundListingSchema>;

export const searchFoundListingsQuerySchema = z.object({
  category: z.nativeEnum(Category).optional(),
  locationId: z.string().trim().optional(),
  foundFrom: z.coerce.date().optional(),
  foundTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(50).default(20),
});

export type SearchFoundListingsQuery = z.infer<typeof searchFoundListingsQuerySchema>;

export const updateFoundListingSchema = z.object({
  category: z.nativeEnum(Category).optional(),
  locationId: z.string().trim().min(1).optional(),
  foundAt: z.coerce
    .date()
    .refine((date) => date <= new Date(), {
      message: 'Date and time found cannot be in the future',
    })
    .optional(),
  description: z.string().trim().max(1000).optional().nullable(),
});

export type UpdateFoundListingInput = z.infer<typeof updateFoundListingSchema>;
