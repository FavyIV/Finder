import { z } from 'zod';
import { Category } from '@prisma/client';

export const createLostListingSchema = z.object({
  category: z.nativeEnum(Category, {
    errorMap: () => ({ message: 'Please select a valid category' }),
  }),
  description: z
    .string()
    .trim()
    .min(5, 'Description must be at least 5 characters long')
    .max(1000, 'Description must not exceed 1000 characters'),
});

export type CreateLostListingInput = z.infer<typeof createLostListingSchema>;

export const updateLostListingSchema = z
  .object({
    category: z.nativeEnum(Category).optional(),
    description: z
      .string()
      .trim()
      .min(5, 'Description must be at least 5 characters long')
      .max(1000, 'Description must not exceed 1000 characters')
      .optional(),
  })
  .refine((data) => data.category !== undefined || data.description !== undefined, {
    message: 'At least one field (category or description) must be provided for update',
  });

export type UpdateLostListingInput = z.infer<typeof updateLostListingSchema>;

export const queryLostListingsSchema = z.object({
  category: z.nativeEnum(Category).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(50).default(20),
  mineOnly: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});

export type QueryLostListingsInput = z.infer<typeof queryLostListingsSchema>;
