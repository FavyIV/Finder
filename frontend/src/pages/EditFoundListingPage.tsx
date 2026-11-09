import { useState, useEffect, type ReactElement, type ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CATEGORIES, type Category } from '../types/found-listing.types';
import { useFoundListing, useUpdateFoundListing } from '../hooks/useFoundListings';
import { useLocations } from '../hooks/useLocations';
import { useCurrentUser } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

type EditFoundItemFormValues = {
  category: Category;
  locationId: string;
  foundAtDate: string;
  foundAtTime: string;
  description: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export function EditFoundListingPage(): ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const listingId = id ?? '';
  const {
    data: listing,
    isLoading: isLoadingListing,
    error: listingError,
  } = useFoundListing(listingId);
  const { data: currentUser, isLoading: isCheckingAuth } = useCurrentUser();
  const { data: locations, isLoading: isLoadingLocations } = useLocations();
  const updateMutation = useUpdateFoundListing(listingId);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditFoundItemFormValues>();

  useEffect(() => {
    if (listing) {
      const foundDate = new Date(listing.foundAt);
      const datePart = foundDate.toISOString().split('T')[0] ?? '';
      const timePart = foundDate.toTimeString().slice(0, 5);

      reset({
        category: listing.category,
        locationId: listing.location.id,
        foundAtDate: datePart,
        foundAtTime: timePart,
        description: listing.description ?? '',
      });
    }
  }, [listing, reset]);

  const handlePhotoChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setPhotoError(null);
    const file = e.target.files?.[0];
    if (!file) {
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setPhotoError('Only JPEG, JPG, and PNG images are allowed.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setPhotoError('Image size exceeds 10 MB limit.');
      setSelectedFile(null);
      setPreviewUrl(null);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const onSubmit = async (data: EditFoundItemFormValues): Promise<void> => {
    const foundAtDateTime = new Date(`${data.foundAtDate}T${data.foundAtTime}`);
    if (foundAtDateTime > new Date()) {
      alert('The date and time found cannot be in the future.');
      return;
    }

    const formData = new FormData();
    if (selectedFile) {
      formData.append('photo', selectedFile);
    }
    formData.append('category', data.category);
    formData.append('locationId', data.locationId);
    formData.append('foundAt', foundAtDateTime.toISOString());
    formData.append('description', data.description.trim());

    try {
      await updateMutation.mutateAsync(formData);
      navigate(`/found/${listingId}`);
    } catch {
      // Error captured in updateMutation.error
    }
  };

  if (isCheckingAuth || isLoadingListing) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <p className="text-sm text-gray-500">Loading listing details...</p>
      </div>
    );
  }

  if (listingError || !listing) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon="🔍"
          title="Listing Not Found"
          description="The requested listing could not be found or has been removed."
          actions={[{ label: 'Back to Directory', href: '/found', variant: 'primary' }]}
        />
      </div>
    );
  }

  // Invariant #4: Only owner can edit
  const isOwner = currentUser?.id === listing.reportedBy.id;
  if (!isOwner) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon="🚫"
          title="Access Denied"
          description={`You can only edit listings you personally logged. This listing was recorded by ${listing.reportedBy.name}.`}
          actions={[{ label: 'View Listing', href: `/found/${listingId}`, variant: 'primary' }]}
        />
      </div>
    );
  }

  // Invariant #4: Can only edit while AVAILABLE
  if (listing.status !== 'AVAILABLE') {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon="🔒"
          title="Listing Locked"
          description={`This listing is currently in status ${listing.status} and cannot be modified.`}
          actions={[{ label: 'Back to Details', href: `/found/${listingId}`, variant: 'primary' }]}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to={`/found/${listingId}`}
          className="text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 text-xs font-semibold"
        >
          ← Cancel and return to listing
        </Link>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Editing Listing #{listingId.slice(0, 8)}
        </span>
      </div>

      <Card padding="lg">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
          Edit Found Listing
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Update the item's details or photo while it remains available for collection.
        </p>

        {updateMutation.error && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
          >
            {updateMutation.error.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
          {/* Photo Replacement */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Item Photo{' '}
              <span className="font-normal lowercase text-gray-400">(optional replacement)</span>
            </label>
            <div className="hover:border-brand-500 dark:bg-gray-850 mt-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-all duration-150 dark:border-gray-700">
              <div className="flex flex-col items-center">
                <img
                  src={previewUrl || listing.photoUrl}
                  alt="Item preview"
                  className="shadow-xs max-h-60 rounded-xl object-contain"
                />
                <div className="mt-3 flex gap-3">
                  <label
                    htmlFor="edit-photo-upload"
                    className="text-brand-600 dark:text-brand-400 hover:text-brand-700 cursor-pointer text-xs font-semibold"
                  >
                    {previewUrl ? 'Change new photo' : 'Upload replacement photo'}
                  </label>
                  {previewUrl && (
                    <>
                      <span className="text-gray-300">|</span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl(null);
                        }}
                        className="text-xs font-semibold text-red-600 hover:text-red-700"
                      >
                        Keep original photo
                      </button>
                    </>
                  )}
                </div>
              </div>
              <input
                id="edit-photo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handlePhotoChange}
                className="sr-only"
              />
            </div>
            {photoError && <p className="mt-1 text-xs font-medium text-red-600">{photoError}</p>}
          </div>

          {/* Category */}
          <Select
            label="Category"
            id="category"
            error={errors.category?.message}
            {...register('category', { required: 'Please select a category' })}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </Select>

          {/* Location */}
          <Select
            label="Security Post Location"
            id="locationId"
            disabled={isLoadingLocations}
            error={errors.locationId?.message}
            {...register('locationId', { required: 'Please select a security post' })}
          >
            {locations?.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </Select>

          {/* Date & Time Found */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Date Found"
              id="foundAtDate"
              type="date"
              error={errors.foundAtDate?.message}
              {...register('foundAtDate', { required: 'Date found is required' })}
            />
            <Input
              label="Time Found"
              id="foundAtTime"
              type="time"
              error={errors.foundAtTime?.message}
              {...register('foundAtTime', { required: 'Time found is required' })}
            />
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              Description
            </label>
            <textarea
              id="description"
              rows={3}
              {...register('description')}
              className="focus:ring-brand-500 focus:border-brand-500 block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-3 dark:border-gray-800">
            <Link to={`/found/${listingId}`}>
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

export default EditFoundListingPage;
