import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { registerFormSchema, type RegisterFormData } from '../schemas/auth.schema';
import { useRegister } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="bg-brand-600 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-md">
            F
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
            Create an account
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Join the official campus recovery community
          </p>
        </div>

        <div className="mt-8">
          <Card padding="lg">
            {/* Domain constraint note */}
            <div className="border-brand-200 dark:border-brand-800 bg-brand-50/70 dark:bg-brand-950/60 text-brand-900 dark:text-brand-300 mb-5 rounded-xl border p-3.5 text-xs">
              <span className="font-semibold">Note:</span> Only institutional email addresses ending
              in <code className="font-mono font-bold">@futa.edu.ng</code> are accepted for security
              and student verification.
            </div>

            {registerMutation.error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
              >
                {registerMutation.error.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="Full Name"
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Adebayo Ogunlesi"
                error={errors.name?.message}
                {...register('name')}
              />

              <Input
                label="School Email (@futa.edu.ng)"
                id="email"
                type="email"
                autoComplete="email"
                placeholder="student@futa.edu.ng"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password (min 8 characters)"
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />

              <div className="pt-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isSubmitting || registerMutation.isPending}
                  disabled={isSubmitting || registerMutation.isPending}
                >
                  {registerMutation.isPending ? 'Creating account...' : 'Create account'}
                </Button>
              </div>
            </form>

            <div className="mt-6 border-t border-gray-100 pt-5 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Already have an account?{' '}
              <Link
                to="/login"
                className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-semibold transition-colors"
              >
                Sign in
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
