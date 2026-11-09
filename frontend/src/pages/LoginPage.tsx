import type { ReactElement } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { loginFormSchema, type LoginFormData } from '../schemas/auth.schema';
import { useLogin } from '../hooks/useAuth';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';

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
    <div className="flex min-h-[calc(100vh-4rem)] flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="bg-brand-600 mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-2xl font-extrabold text-white shadow-md">
            F
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl dark:text-gray-100">
            Welcome back
          </h2>
          <p className="mt-1.5 text-sm text-gray-500 dark:text-gray-400">
            Sign in with your FUTA institutional account
          </p>
        </div>

        <div className="mt-8">
          <Card padding="lg">
            {loginMutation.error && (
              <div
                role="alert"
                className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-semibold text-red-700 dark:border-red-800 dark:bg-red-950/60 dark:text-red-300"
              >
                {loginMutation.error.message}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Input
                label="School Email"
                id="email"
                type="email"
                autoComplete="email"
                placeholder="student@futa.edu.ng"
                error={errors.email?.message}
                {...register('email')}
              />

              <Input
                label="Password"
                id="password"
                type="password"
                autoComplete="current-password"
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
                  loading={isSubmitting || loginMutation.isPending}
                  disabled={isSubmitting || loginMutation.isPending}
                >
                  {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
                </Button>
              </div>
            </form>

            <div className="mt-6 border-t border-gray-100 pt-5 text-center text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
              Don't have an account yet?{' '}
              <Link
                to="/register"
                className="text-brand-600 dark:text-brand-400 hover:text-brand-700 font-semibold transition-colors"
              >
                Register (@futa.edu.ng)
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
