import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerFormSchema, type RegisterFormData } from '../schemas/auth.schema';
import { useRegister } from '../hooks/useAuth';

export function RegisterPage(): ReactElement {
  const navigate = useNavigate();
  const registerMutation = useRegister();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
  });

  const onSubmit = async (data: RegisterFormData): Promise<void> => {
    try {
      await registerMutation.mutateAsync(data);
      navigate('/');
    } catch {
      // Error handled by registerMutation.error display
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="text-brand-900 text-center text-3xl font-extrabold tracking-tight">
          Campus Lost &amp; Found
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Create your account with your university email
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-8 shadow-sm sm:px-10">
          {registerMutation.error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {registerMutation.error.message}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="mt-1">
                <input
                  id="name"
                  type="text"
                  autoComplete="name"
                  {...register('name')}
                  className="focus:border-brand-500 focus:ring-brand-500 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm"
                />
                {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                School Email (@futa.edu.ng)
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
                Password (min 8 characters)
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  type="password"
                  autoComplete="new-password"
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
                disabled={isSubmitting || registerMutation.isPending}
                className="bg-brand-600 hover:bg-brand-700 focus:ring-brand-500 flex w-full justify-center rounded-md px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50"
              >
                {registerMutation.isPending ? 'Creating account...' : 'Create account'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-gray-500">Already have an account? </span>
            <Link to="/login" className="text-brand-600 hover:text-brand-500 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
