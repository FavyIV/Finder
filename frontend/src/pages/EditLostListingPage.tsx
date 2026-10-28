import { useState, useEffect, type ReactElement } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLostListing, useUpdateLostListing } from '../hooks/useLostListings';
import { useCurrentUser } from '../hooks/useAuth';
import { CATEGORIES, type Category } from '../types/found-listing.types';

const editLostSchema = z.object({
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

type EditLostFormData = z.infer<typeof editLostSchema>;

export function EditLostListingPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const listingId = id ?? '';
  const navigate = useNavigate();

  const { data: listing, isLoading, error } = useLostListing(listingId);
  const { data: currentUser } = useCurrentUser();
  const updateMutation = useUpdateLostListing(listingId);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<EditLostFormData>({
    resolver: zodResolver(editLostSchema),
  });

  const descriptionValue = watch('description') ?? '';

  useEffect(() => {
    if (listing) {
      reset({
        category: listing.category,
        description: listing.description,
      });
    }
  }, [listing, reset]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Loading lost item notice...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-red-700">Notice Not Found</h2>
          <p className="mt-1 text-xs text-gray-600">
            {error?.message || 'The requested lost item notice could not be found.'}
          </p>
          <div className="mt-4">
            <Link
              to="/lost"
              className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-xs font-semibold text-white"
            >
              Back to Lost Notices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOwner = currentUser?.id === listing.postedBy.id;

  if (!isOwner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-lg border border-amber-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-amber-800">Edit Permission Denied</h2>
          <p className="mt-1 text-xs text-gray-600">
            Only the campus community member who posted this notice can make changes.
          </p>
          <div className="mt-4">
            <Link
              to="/lost"
              className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-xs font-semibold text-white"
            >
              Back to Lost Notices
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const onSubmit = async (data: EditLostFormData): Promise<void> => {
    setServerError(null);
    try {
      await updateMutation.mutateAsync({
        category: data.category as Category,
        description: data.description,
      });
      navigate('/lost');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setServerError(err.message);
      } else {
        setServerError('Failed to update notice.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-xl">
        <div className="mb-6">
          <Link to="/lost" className="text-brand-600 hover:text-brand-500 text-xs font-medium">
            ← Back to Lost Notices
          </Link>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-gray-900">
            Edit Lost Item Notice
          </h1>
          <p className="mt-1 text-xs text-gray-600">
            Update category details or add extra descriptive features to help find your missing
            property.
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

            <div className="flex justify-end gap-3 pt-3">
              <Link
                to="/lost"
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 rounded-md px-4 py-2 text-xs font-semibold text-white shadow-sm focus:outline-none focus:ring-2 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditLostListingPage;
