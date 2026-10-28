import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryResult,
  type UseMutationResult,
} from '@tanstack/react-query';
import { getMeApi, loginApi, registerApi } from '../api/auth.api';
import { getStoredToken, removeStoredToken, type ApiError } from '../api/client';
import type { UserProfile, AuthResponse, LoginPayload, RegisterPayload } from '../types/auth.types';

export const AUTH_QUERY_KEY = ['auth', 'me'] as const;

export function useCurrentUser(): UseQueryResult<UserProfile, ApiError> {
  const token = getStoredToken();
  return useQuery({
    queryKey: AUTH_QUERY_KEY,
    queryFn: getMeApi,
    enabled: Boolean(token),
    retry: false,
  });
}

export function useLogin(): UseMutationResult<AuthResponse, ApiError, LoginPayload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginApi,
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
    },
  });
}

export function useRegister(): UseMutationResult<AuthResponse, ApiError, RegisterPayload> {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: registerApi,
    onSuccess: (data) => {
      queryClient.setQueryData(AUTH_QUERY_KEY, data.user);
    },
  });
}

export function useLogout(): () => void {
  const queryClient = useQueryClient();

  return () => {
    removeStoredToken();
    queryClient.removeQueries({ queryKey: AUTH_QUERY_KEY });
  };
}
