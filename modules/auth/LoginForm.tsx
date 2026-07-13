'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('registered') === 'true') {
        setSuccess('Business and Admin account registered successfully! Please sign in.');
      }
    }
  }, []);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const handleFillDummyData = () => {
    setValue('email', 'recruiter@stockpilot.com');
    setValue('password', 'password123');
    setError(null);
    showToast.success('Dummy credentials filled!');
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const successResult = await login(data.email, data.password);
      if (successResult) {
        setSuccess('Signed in successfully! Redirecting...');
        showToast.success('Signed in successfully!');
        router.push('/dashboard');
      } else {
        setError('Invalid email or password. Please verify your credentials and try again.');
        showToast.error('Invalid email or password');
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
      showToast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-2">StockPilot</h1>
        <p className="text-sm text-muted-foreground">Smart Inventory & Expiry Tracker</p>
      </div>

      {error && (
        <div className="mb-5 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
          <span className="shrink-0 mt-0.5">⚠️</span>
          <span className="leading-relaxed">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-5 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium flex items-start gap-2.5 animate-in fade-in duration-200">
          <span className="shrink-0 mt-0.5">✅</span>
          <span className="leading-relaxed">{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Email</label>
          <Input
            type="email"
            placeholder="name@business.com"
            className={errors.email ? 'border-destructive focus:ring-destructive/20' : ''}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">Password</label>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            className={errors.password ? 'border-destructive focus:ring-destructive/20' : ''}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-destructive mt-1.5">{errors.password.message}</p>}
        </div>

        <div className="pt-2 space-y-3">
          <Button
            type="button"
            variant="outline"
            onClick={handleFillDummyData}
            className="w-full py-2.5 h-11 text-sm font-semibold transition-all border-dashed border-primary/30 text-primary hover:bg-primary/5 hover:border-primary cursor-pointer"
          >
            ✨ Fill Dummy Data
          </Button>

          <Button type="submit" className="w-full py-2.5 h-11 text-sm font-semibold transition-all" disabled={isSubmitting}>
            {isSubmitting ? 'Signing In...' : 'Sign In'}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <span>Don&apos;t have an account? </span>
        <Link href="/register" className="text-primary font-semibold hover:underline">
          Create business account
        </Link>
      </div>
    </div>
  );
}
