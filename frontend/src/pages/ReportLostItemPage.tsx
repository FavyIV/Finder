import { useState, type ReactElement } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateLostListing } from '../hooks/useLostListings';
import { useCurrentUser } from '../hooks/useAuth';
import { CATEGORIES, type Category } from '../types/found-listing.types';

const reportLostSchema = z.object({
  category: z.enum([
    'ELECTRONICS',
    'CLOTHING',
    'ACCESSORIES',
    'BOOKS',
    'DOCUMENTS',
    'KEYS',
    'BAGS',
    'OTHER',
  ]),
  description: z
    .string()
    .trim()
    .min(5, 'Description must be at least 5 characters')
    .max(1000, 'Description cannot exceed 1000 characters'),
});

type ReportLostFormData = z.infer<typeof reportLostSchema>;

export function ReportLostItemPage(): ReactElement {
  const navigate = useNavigate();
  const { data: user, isLoading: isAuthLoading } = useCurrentUser();
  const createMutation = useCreateLostListing();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ReportLostFormData>({
    resolver: zodResolver(reportLostSchema),
    defaultValues: {
      category: 'ELECTRONICS',
      description: '',
    },
  });

  const descriptionValue = watch('description') ?? '';

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Checking credentials...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-red-700">Authentication Required</h2>
          <p className="mt-1 text-xs text-gray-600">
            You must be logged in with your school email to report a lost item.
          </p>
          <div className="mt-4">
            <Link
              to="/login"
              className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-xs font-semibold text-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: ReportLostFormData): Promise<void> => {
    setServerError(null);
    try {
      await createMutation.mutateAsync({
        category: data.category as Category,
        description: data.description,
      });
      navigate('/lost');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Failed to submit lost item report.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <Link to="/lost" className="text-brand-600 hover:text-brand-500 text-xs font-medium">
            ← Back to Lost Items
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            Post a Lost Item Notice
          </h1>
          <p className="mt-1 text-xs text-gray-600">
            Didn't find your item in the found directory? Describe what you lost so members of the
            campus community and security desks can recognize it.
          </p>
        </div>

        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {serverError && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-xs text-red-700"
            >
              {serverError}
            </div>
          )}

          <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="space-y-5">
            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-xs font-semibold text-gray-700">
                Item Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                {...register('category')}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 bg-white p-2.5 text-xs text-gray-900 shadow-sm focus:outline-none focus:ring-1"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
              )}
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-xs font-semibold text-gray-700">
                Item Description &amp; Identifying Details <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                rows={5}
                {...register('description')}
                placeholder="Describe color, brand, model, distinguishing stickers/scratches, approximate date and lecture hall where you lost it..."
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 p-2.5 text-xs text-gray-900 shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-1"
                maxLength={1000}
              />
              <div className="mt-1 flex justify-between text-[11px] text-gray-400">
                <span>Min 5 characters</span>
                <span>{descriptionValue.length}/1000</span>
              </div>
              {errors.description && (
                <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
              )}
            </div>

            {/* Privacy notice banner (Invariant #6) */}
            <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
              <p className="font-semibold">🔒 Campus Security Protocol</p>
              <p className="mt-0.5 text-[11px] text-blue-700">
                Your name will appear on the notice, but your phone and email are never shared
                publicly. When an item is found, it will be deposited at a campus security post
                where in-person ID verification occurs.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Link
                to="/lost"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || createMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 rounded-md px-4 py-2 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Posting Notice...' : 'Post Lost Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportLostItemPage;
