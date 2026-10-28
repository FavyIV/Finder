import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginFormSchema, type LoginFormData } from '../schemas/auth.schema';
import { useLogin } from '../hooks/useAuth';

export function LoginPage(): ReactElement {
  const navigate = useNavigate();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  const onSubmit = async (data: LoginFormData): Promise<void> => {
    try {
      await loginMutation.mutateAsync(data);
      navigate('/');
    } catch {
      // Error handled by loginMutation.error display
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-brand-900 text-center text-3xl font-extrabold tracking-tight">
          Campus Lost &amp; Found
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 shadow-sm sm:px-10">
          {loginMutation.error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {loginMutation.error.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                School Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="student@futa.edu.ng"
                  {...register('email')}
                  className="focus:border-brand-500 focus:ring-brand-500 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm"
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className="focus:border-brand-500 focus:ring-brand-500 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm"
                />
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isSubmitting || loginMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Don't have an account? </span>
            <Link to="/register" className="text-brand-600 hover:text-brand-500 font-medium">
              Register with @futa.edu.ng
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
