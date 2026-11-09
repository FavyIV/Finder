import { useState, type ReactElement, type ChangeEvent } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { CATEGORIES, type Category } from '../types/found-listing.types';
import { useLocations } from '../hooks/useLocations';
import { useCreateFoundListing } from '../hooks/useFoundListings';
import { useCurrentUser } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';

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
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
        <p className="text-sm text-gray-500">Checking credentials...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <EmptyState
          icon="🔒"
          title="Sign in required"
          description="You must be signed in with your verified school email to report a found item on campus."
          actions={[{ label: 'Sign in to Continue', href: '/login', variant: 'primary' }]}
        />
      </div>
    );
  }

  if (successListingId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <Card padding="lg" className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl text-green-600 dark:bg-green-950/70 dark:text-green-400">
            ✓
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-gray-100">
            Found Item Logged!
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500 dark:text-gray-400">
            Thank you for turning this in. The item is now listed in the campus directory as{' '}
            <strong className="font-semibold text-green-600">Available</strong> for its verified
            owner to recover at the designated security post.
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <Link to={`/found/${successListingId}`}>
              <Button variant="primary" fullWidth size="md">
                View Item Listing
              </Button>
            </Link>
            <Button
              type="button"
              variant="secondary"
              fullWidth
              size="md"
              onClick={() => {
                setSuccessListingId(null);
                setSelectedFile(null);
                setPreviewUrl(null);
              }}
            >
              Report Another Item
            </Button>
            <Link to="/found">
              <Button variant="ghost" fullWidth size="md">
                Back to Directory
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Header */}
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/found"
          className="text-brand-600 dark:text-brand-400 hover:text-brand-700 flex items-center gap-1 text-xs font-semibold"
        >
          ← Back to Directory
        </Link>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          Logging as{' '}
          <strong className="font-semibold text-gray-800 dark:text-gray-200">
            {currentUser.name}
          </strong>
        </span>
      </div>

      <Card padding="lg">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
          Report a Found Item
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Log an item discovered on campus so its rightful owner can claim it from security.
        </p>

        {/* Security Post Reminder Banner */}
        <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
          <p className="flex items-center gap-1 font-bold">
            <span>📦</span> Physical Drop-Off Rule
          </p>
          <p className="mt-1 leading-relaxed">
            All found items must be handed over to the nearest campus security post or porter desk
            first. The app does not support peer-to-peer meetups.
          </p>
        </div>

        {createListingMutation.error && (
          <div
            role="alert"
            className="mt-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
          >
            {createListingMutation.error.message}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
          {/* Photo Upload Zone */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              Item Photo <span className="text-red-500">*</span>
            </label>
            <div className="hover:border-brand-500 dark:bg-gray-850 mt-1 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-6 transition-all duration-150 dark:border-gray-700">
              {previewUrl ? (
                <div className="flex flex-col items-center">
                  <img
                    src={previewUrl}
                    alt="Found item preview"
                    className="shadow-xs max-h-60 rounded-xl object-contain"
                  />
                  <div className="mt-3 flex gap-3">
                    <label
                      htmlFor="photo-upload"
                      className="text-brand-600 dark:text-brand-400 hover:text-brand-700 cursor-pointer text-xs font-semibold"
                    >
                      Change photo
                    </label>
                    <span className="text-gray-300">|</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewUrl(null);
                      }}
                      className="text-xs font-semibold text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label htmlFor="photo-upload" className="cursor-pointer text-center">
                  <span className="text-4xl" aria-hidden="true">
                    📷
                  </span>
                  <p className="text-brand-600 dark:text-brand-400 hover:text-brand-700 mt-2 text-sm font-semibold">
                    Upload or take a photo of the item
                  </p>
                  <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                    JPEG, JPG, or PNG up to 10 MB
                  </p>
                </label>
              )}
              <input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/jpg,image/png"
                onChange={handlePhotoChange}
                className="sr-only"
              />
            </div>
            {photoError && <p className="mt-1 text-xs font-medium text-red-600">{photoError}</p>}
          </div>

          {/* Category Dropdown */}
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

          {/* Drop-off Location Dropdown */}
          <Select
            label="Drop-off Security Post"
            id="locationId"
            disabled={isLoadingLocations}
            error={
              errors.locationId?.message ||
              (locationsError ? 'Failed to load locations' : undefined)
            }
            {...register('locationId', { required: 'Please select a drop-off post' })}
          >
            <option value="">-- Choose security post where item was dropped --</option>
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

          {/* Additional Description */}
          <div>
            <label
              htmlFor="description"
              className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-300"
            >
              Description <span className="font-normal lowercase text-gray-400">(optional)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Provide color, brand, condition, or any distinctive marks..."
              {...register('description')}
              className="focus:ring-brand-500 focus:border-brand-500 block w-full rounded-xl border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-all duration-150 placeholder:text-gray-400 focus:ring-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isSubmitting || createListingMutation.isPending}
              disabled={isSubmitting || createListingMutation.isPending}
            >
              {createListingMutation.isPending ? 'Logging Found Item...' : 'Submit Found Item'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

export default ReportFoundItemPage;
