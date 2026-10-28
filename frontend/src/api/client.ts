export type ApiErrorResponse = {
  error: {
    code: string;
    message: string;
  };
};

export class ApiError extends Error {
  public readonly code: string;
  public readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

const AUTH_TOKEN_KEY = 'campus_laf_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredToken(token: string): void {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function removeStoredToken(): void {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

/**
 * Standard fetch wrapper that enforces API standards:
 * - Prepends /api/v1
 * - Attaches Bearer JWT from localStorage
 * - Unwraps { data: T } envelope
 * - Throws typed ApiError on failures
 */
export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('/') ? `/api/v1${endpoint}` : `/api/v1/${endpoint}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = (await response.json()) as { data?: T } & Partial<ApiErrorResponse>;

  if (!response.ok || json.error) {
    const error = json.error ?? {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
    };
    throw new ApiError(error.code, error.message, response.status);
  }

  return json.data as T;
}

export type PaginatedResponse<T, M> = {
  data: T;
  meta: M;
};

export async function apiClientWithMeta<T, M>(
  endpoint: string,
  options: RequestInit = {},
): Promise<PaginatedResponse<T, M>> {
  const url = endpoint.startsWith('/') ? `/api/v1${endpoint}` : `/api/v1/${endpoint}`;
  const token = getStoredToken();

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = (await response.json()) as { data?: T; meta?: M } & Partial<ApiErrorResponse>;

  if (!response.ok || json.error) {
    const error = json.error ?? {
      code: 'UNKNOWN_ERROR',
      message: 'An unexpected error occurred.',
    };
    throw new ApiError(error.code, error.message, response.status);
  }

  return {
    data: json.data as T,
    meta: json.meta as M,
  };
}
