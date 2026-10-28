import { apiClient, setStoredToken } from './client';
import type { AuthResponse, UserProfile, RegisterPayload, LoginPayload } from '../types/auth.types';

export async function registerApi(payload: RegisterPayload): Promise<AuthResponse> {
  const result = await apiClient<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(result.token);
  return result;
}

export async function loginApi(payload: LoginPayload): Promise<AuthResponse> {
  const result = await apiClient<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  setStoredToken(result.token);
  return result;
}

export async function getMeApi(): Promise<UserProfile> {
  return apiClient<UserProfile>('/auth/me', {
    method: 'GET',
  });
}
