import { useState, useEffect, type ReactElement, type ChangeEvent } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { CATEGORIES, type Category } from '../types/found-listing.types';
import { useFoundListing, useUpdateFoundListing } from '../hooks/useFoundListings';
import { useLocations } from '../hooks/useLocations';
import { useCurrentUser } from '../hooks/useAuth';

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
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Loading listing details...</p>
      </div>
    );
  }

  if (listingError || !listing) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-red-700">Listing Not Found</h2>
          <p className="mt-1 text-sm text-gray-600">
            The listing could not be found or has been removed.
          </p>
          <div className="mt-4">
            <Link to="/found" className="text-brand-600 hover:text-brand-500 text-sm font-medium">
              Back to Search
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Enforce Invariant #4: Only owner can edit
  const isOwner = currentUser?.id === listing.reportedBy.id;
  if (!isOwner) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-lg font-bold text-red-700">Access Denied</h2>
          <p className="mt-2 text-sm text-gray-600">
            You can only edit listings you reported. This listing belongs to{' '}
            {listing.reportedBy.name}.
          </p>
          <div className="mt-4">
            <Link
              to={`/found/${listingId}`}
              className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              View Listing
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Enforce Invariant #4: Can only edit while AVAILABLE
  if (listing.status !== 'AVAILABLE') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-lg border border-amber-200 bg-white p-6 text-center shadow-sm">
          <span className="text-3xl">🔒</span>
          <h2 className="mt-2 text-lg font-bold text-gray-900">Listing Locked</h2>
          <p className="mt-2 text-sm text-gray-600">
            This listing is currently in status{' '}
            <span className="font-semibold">{listing.status}</span> and cannot be edited. It
            reflects a final outcome in the records.
          </p>
          <div className="mt-4">
            <Link
              to={`/found/${listingId}`}
              className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              Back to Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link
            to={`/found/${listingId}`}
            className="text-brand-600 hover:text-brand-500 text-sm font-medium"
          >
            ← Back to Item Details
          </Link>
          <span className="text-xs text-gray-500">Editing as Reporter</span>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Edit Found Listing
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Correct any mistakes made when you logged this found item.
          </p>

          {listing.isUnderReview && (
            <div className="mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-800">
              ⚠️ Note: This listing is currently marked as <strong>Under Review</strong>. Saving
              edits will update the information, but moderator review will remain pending.
            </div>
          )}

          {updateMutation.error && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {updateMutation.error.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6" noValidate>
            {/* Photo update */}
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                Item Photo (Optional Replacement)
              </label>
              <div className="mt-2 flex items-center gap-4">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                  <img
                    src={previewUrl || listing.photoUrl}
                    alt="Current item"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <label
                    htmlFor="photo"
                    className="cursor-pointer rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                    {previewUrl ? 'Change selected photo' : 'Upload replacement photo'}
                  </label>
                  <p className="mt-1 text-xs text-gray-500">JPEG, JPG, or PNG up to 10 MB</p>
                </div>
                <input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handlePhotoChange}
                  className="sr-only"
                />
              </div>
              {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                id="category"
                {...register('category', { required: 'Please select a category' })}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1"
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

            {/* Location */}
            <div>
              <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
                Drop-off Security Post <span className="text-red-500">*</span>
              </label>
              {isLoadingLocations ? (
                <p className="mt-2 text-xs text-gray-500">Loading campus posts...</p>
              ) : (
                <select
                  id="locationId"
                  {...register('locationId', { required: 'Please select a drop-off post' })}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1"
                >
                  {locations?.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name}
                    </option>
                  ))}
                </select>
              )}
              {errors.locationId && (
                <p className="mt-1 text-xs text-red-600">{errors.locationId.message}</p>
              )}
            </div>

            {/* Date and Time Found */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="foundAtDate" className="block text-sm font-medium text-gray-700">
                  Date Found <span className="text-red-500">*</span>
                </label>
                <input
                  id="foundAtDate"
                  type="date"
                  {...register('foundAtDate', { required: 'Date found is required' })}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1"
                />
                {errors.foundAtDate && (
                  <p className="mt-1 text-xs text-red-600">{errors.foundAtDate.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="foundAtTime" className="block text-sm font-medium text-gray-700">
                  Time Found <span className="text-red-500">*</span>
                </label>
                <input
                  id="foundAtTime"
                  type="time"
                  {...register('foundAtTime', { required: 'Time found is required' })}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1"
                />
                {errors.foundAtTime && (
                  <p className="mt-1 text-xs text-red-600">{errors.foundAtTime.message}</p>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                {...register('description')}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <Link
                to={`/found/${listingId}`}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving changes...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditFoundListingPage;
