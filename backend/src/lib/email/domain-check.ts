import { SCHOOL_EMAIL_DOMAIN } from '../../config/constants';

/**
 * Validates that an email address has the required school domain.
 * Normalizes input by trimming and converting to lowercase before verification.
 */
export function isValidSchoolEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  const normalized = email.trim().toLowerCase();
  return normalized.endsWith(SCHOOL_EMAIL_DOMAIN.toLowerCase());
}
