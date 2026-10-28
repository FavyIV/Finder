import { z } from 'zod';

export const registerFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters long'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .refine(
      (email) => email.toLowerCase().endsWith('@futa.edu.ng'),
      'Must be a valid @futa.edu.ng email address',
    ),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
});

export type RegisterFormData = z.infer<typeof registerFormSchema>;

export const loginFormSchema = z.object({
  email: z.string().trim().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
