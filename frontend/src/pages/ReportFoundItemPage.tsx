import { useState, type ReactElement, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { CATEGORIES, type Category } from '../types/found-listing.types';
import { useLocations } from '../hooks/useLocations';
import { useCreateFoundListing } from '../hooks/useFoundListings';
import { useCurrentUser } from '../hooks/useAuth';

type FoundItemFormValues = {
  category: Category;
  locationId: string;
  foundAtDate: string;
  foundAtTime: string;
  description: string;
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

export function ReportFoundItemPage(): ReactElement {
  const navigate = useNavigate();
  const { data: currentUser, isLoading: isCheckingAuth } = useCurrentUser();
  const { data: locations, isLoading: isLoadingLocations, error: locationsError } = useLocations();
  const createListingMutation = useCreateFoundListing();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [successListingId, setSuccessListingId] = useState<string | null>(null);

  const now = new Date();
  const defaultDate = now.toISOString().split('T')[0] ?? '';
  const defaultTime = now.toTimeString().slice(0, 5);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FoundItemFormValues>({
    defaultValues: {
      category: 'ELECTRONICS',
      locationId: '',
      foundAtDate: defaultDate,
      foundAtTime: defaultTime,
      description: '',
    },
  });

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

  const onSubmit = async (data: FoundItemFormValues): Promise<void> => {
    if (!selectedFile) {
      setPhotoError('Please upload a clear photo of the found item.');
      return;
    }

    const foundAtDateTime = new Date(`${data.foundAtDate}T${data.foundAtTime}`);
    if (foundAtDateTime > new Date()) {
      alert('The date and time found cannot be in the future.');
      return;
    }

    const formData = new FormData();
    formData.append('photo', selectedFile);
    formData.append('category', data.category);
    formData.append('locationId', data.locationId);
    formData.append('foundAt', foundAtDateTime.toISOString());
    if (data.description.trim()) {
      formData.append('description', data.description.trim());
    }

    try {
      const listing = await createListingMutation.mutateAsync(formData);
      setSuccessListingId(listing.id);
    } catch {
      // Error is captured in createListingMutation.error
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
        <p className="text-sm text-gray-500">Checking authentication...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md rounded-lg border border-gray-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Sign in required</h2>
          <p className="mt-2 text-sm text-gray-600">
            You must be logged in with your verified student email to report a found item.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/login"
              className="bg-brand-600 hover:bg-brand-700 rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (successListingId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 p-4">
        <div className="w-full max-w-md rounded-lg border border-green-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <span className="text-2xl text-green-600">✓</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">Listing Logged!</h2>
          <p className="mt-2 text-sm text-gray-600">
            Thank you for being a responsible member of the campus community. The item is now listed
            as <span className="font-semibold text-green-700">AVAILABLE</span> for its owner to
            find.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => {
                setSuccessListingId(null);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
              className="bg-brand-600 hover:bg-brand-700 w-full rounded-md px-4 py-2 text-sm font-medium text-white"
            >
              Report Another Item
            </button>
            <button
              type="button"
              onClick={() => navigate('/')}
              className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="text-brand-600 hover:text-brand-500 text-sm font-medium">
            ← Back to Home
          </Link>
          <span className="text-xs text-gray-500">Reporting as {currentUser.name}</span>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
            Report a Found Item
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Log an item you discovered on campus so its rightful owner can claim it at security.
          </p>

          {/* Security Post Reminder Banner (Goal #3 Invariant) */}
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <p className="font-semibold">⚠️ Physical Drop-Off Requirement</p>
            <p className="mt-1 text-xs">
              All found items must be deposited at the nearest security or porter post. The app does
              not facilitate direct meetups between finders and losers.
            </p>
          </div>

          {createListingMutation.error && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {createListingMutation.error.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6" noValidate>
            {/* Photo Upload */}
            <div>
              <label htmlFor="photo" className="block text-sm font-medium text-gray-700">
                Item Photo <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500">JPEG, JPG, or PNG up to 10 MB</p>
              <div className="hover:border-brand-500 mt-2 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 p-6">
                {previewUrl ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={previewUrl}
                      alt="Found item preview"
                      className="max-h-56 rounded-md object-contain"
                    />
                    <label
                      htmlFor="photo"
                      className="text-brand-600 hover:text-brand-500 mt-3 cursor-pointer text-xs font-semibold"
                    >
                      Change photo
                    </label>
                  </div>
                ) : (
                  <label htmlFor="photo" className="cursor-pointer text-center">
                    <span className="text-3xl">📷</span>
                    <p className="text-brand-600 hover:text-brand-500 mt-2 text-sm font-medium">
                      Upload photo of the item
                    </p>
                  </label>
                )}
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

            {/* Category Dropdown */}
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

            {/* Drop-off Location Dropdown */}
            <div>
              <label htmlFor="locationId" className="block text-sm font-medium text-gray-700">
                Drop-off Security Post <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-gray-500">
                Select the physical security post where you deposited this item
              </p>
              {isLoadingLocations ? (
                <p className="mt-2 text-xs text-gray-500">Loading campus posts...</p>
              ) : locationsError ? (
                <p className="mt-2 text-xs text-red-600">Failed to load locations.</p>
              ) : (
                <select
                  id="locationId"
                  {...register('locationId', { required: 'Please select a drop-off post' })}
                  className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1"
                >
                  <option value="">-- Choose security post --</option>
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
                  max={defaultDate}
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

            {/* Optional Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description (Optional)
              </label>
              <p className="text-xs text-gray-500">
                Include notable visual details (colour, brand, key fob, casing)
              </p>
              <textarea
                id="description"
                rows={3}
                placeholder="e.g. Black HP laptop charger found in lecture hall row 4"
                {...register('description')}
                className="focus:border-brand-500 focus:ring-brand-500 mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1"
              />
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || createListingMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              >
                {createListingMutation.isPending ? 'Logging Found Item...' : 'Log Found Item'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportFoundItemPage;
