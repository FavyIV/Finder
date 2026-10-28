// Single source of truth for every magic number / string in the codebase.
// All values are imported from here — never duplicated inline.

/** Listings older than this many days are treated as expired at read time. */
export const LISTING_EXPIRY_DAYS = 30;

/** School email domain. Registration is restricted to addresses ending in this value. */
export const SCHOOL_EMAIL_DOMAIN = '@futa.edu.ng';

/** Maximum photo file size accepted at the upload endpoint (Cloudinary free-tier cap). */
export const MAX_PHOTO_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

/** MIME types accepted for found-item photo uploads. */
export const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/jpg', 'image/png'] as const;

/** Maximum number of results the client may request per page. */
export const MAX_PAGE_SIZE = 50;

/** Default page size when the client does not specify one. */
export const DEFAULT_PAGE_SIZE = 20;
