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
