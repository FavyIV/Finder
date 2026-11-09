import { useState, useEffect, type ReactElement } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLostListing, useUpdateLostListing } from '../hooks/useLostListings';
import { useCurrentUser } from '../hooks/useAuth';
import { CATEGORIES, type Category } from '../types/found-listing.types';
import { Card } from '../components/ui/Card';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <p className="text-sm text-gray-500">Loading lost item notice...</p>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon="🔍"
          title="Notice Not Found"
          description={error?.message || 'The requested lost item notice could not be found.'}
          actions={[{ label: 'Back to Lost Notices', href: '/lost', variant: 'primary' }]}
        />
      </div>
    );
  }

  const isOwner = currentUser?.id === listing.postedBy.id;

  if (!isOwner) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon="🚫"
          title="Edit Permission Denied"
          description="Only the campus community member who posted this notice can make changes."
          actions={[{ label: 'Back to Lost Notices', href: '/lost', variant: 'primary' }]}
        />
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
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/lost"
          className="text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 text-xs font-semibold"
        >
          ← Cancel and return to notices
        </Link>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Notice #{listingId.slice(0, 8)}
        </span>
      </div>

      <Card padding="lg">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
          Edit Lost Item Notice
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update the category or add descriptive identifiers to help campus security identify your
          missing property.
        </p>

        {serverError && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-6 space-y-5">
          {/* Category */}
          <Select
            label="Item Category"
            id="category"
            error={errors.category?.message}
            {...register('category')}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              Item Description &amp; Identifying Details <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              rows={5}
              {...register('description')}
              className="focus:ring-brand-500 focus:border-brand-500 block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              maxLength={1000}
            />
            <div className="mt-1.5 flex justify-between text-[11px] text-gray-400">
              <span>Min 5 characters</span>
              <span>{descriptionValue.length}/1000</span>
            </div>
            {errors.description && (
              <p className="mt-1 text-xs font-medium text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
            <Link to="/lost">
              <Button type="button" variant="secondary" size="md">
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSubmitting || updateMutation.isPending}
              disabled={isSubmitting || updateMutation.isPending}
            >
              {updateMutation.isPending ? 'Saving Changes...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default EditLostListingPage;
