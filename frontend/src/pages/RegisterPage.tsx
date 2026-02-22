import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Primitives';
import { BrandLogo } from '../components/BrandLogo';
import { SiteFooter } from '../components/SiteFooter';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    try {
      await register(formData);
      navigate('/', { replace: true });
    } catch (error: any) {
      toast.error(error?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-950">
      <main className="flex-1 grid lg:grid-cols-2">
        <section className="hidden lg:flex items-center justify-center p-14 bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800">
          <div className="max-w-md">
            <BrandLogo />
            <h1 className="mt-8 text-4xl font-semibold text-neutral-900 dark:text-white leading-tight">
              Build your sourcing system
              <span className="block text-neutral-500">in minutes.</span>
            </h1>
            <ul className="mt-6 space-y-3">
              {[
                'Centralize thesis, lists, and company notes',
                'Enrich targets with live web intelligence',
                'Prioritize quickly with Scout recommendations',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-neutral-600 dark:text-neutral-300">
                  <Check className="h-4 w-4 mt-0.5 text-neutral-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-7 sm:p-8 shadow-sm">
            <div className="flex items-center justify-between">
              <BrandLogo compact />
              <span className="text-xs text-neutral-500">Create account</span>
            </div>

            <h2 className="mt-6 text-2xl font-semibold text-neutral-900 dark:text-white">Start free</h2>
            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Set up your workspace and begin scouting.</p>

            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Full name
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  required
                  className="mt-1 block w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 dark:text-white"
                  value={formData.name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
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
                  className="mt-1 block w-full px-3 py-2.5 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg text-sm placeholder-neutral-400 focus:outline-none focus:border-neutral-500 focus:ring-1 focus:ring-neutral-500 dark:text-white"
                  value={formData.password}
                  onChange={(e) => setFormData((prev) => ({ ...prev, password: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full" isLoading={isLoading} disabled={isLoading}>
                Create account
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-neutral-900 dark:text-neutral-200 hover:underline">
                Sign in
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter compact />
    </div>
  );
}
