import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Primitives';
import { BrandLogo } from '../components/BrandLogo';
import { SiteFooter } from '../components/SiteFooter';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      await login({ email: formData.email.trim(), password: formData.password });
      navigate('/', { replace: true });
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950">
      <main className="flex-1 grid lg:grid-cols-2">
        <section className="hidden lg:flex items-center justify-center p-14 bg-neutral-900 text-neutral-100">
          <div className="max-w-md">
            <BrandLogo className="text-white" />
            <h1 className="mt-8 text-4xl font-semibold leading-tight">
              Focused Intelligence
              <span className="block text-neutral-400">for disciplined investors.</span>
            </h1>
            <p className="mt-4 text-neutral-300 text-sm leading-relaxed">
              Track deals, enrich company context from the internet, and coordinate investment decisions in a single minimalist workspace.
            </p>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-7 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <BrandLogo compact />
              <span className="text-xs text-neutral-500">Sign in</span>
            </div>

            <h2 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">Welcome back</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Enter your credentials to continue.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-1 block w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 dark:text-white"
                  value={formData.email}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  className="mt-1 block w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 dark:text-white"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
                Continue <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
              New here?{' '}
              <Link to="/register" className="font-medium text-neutral-900 dark:text-neutral-200 hover:underline">
                Create account
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter compact />
    </div>
  );
}
