'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { showToast } from '@/components/ui/toast';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const registerSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters long'),
  name: z.string().min(2, 'FullName must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterForm() {
  const { register: signup } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      businessName: '',
      name: '',
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      const success = await signup(data);
      if (success) {
        showToast.success('Business and Admin account registered successfully! Please log in.');
        router.push('/login');
      } else {
        showToast.error('Registration failed. The email might be in use.');
      }
    } catch (err) {
      showToast.error('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-card rounded-2xl shadow-xl p-8 border border-border">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-primary mb-2">Register</h1>
        <p className="text-sm text-muted-foreground">Set up your business and admin user</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Business Name</label>
          <Input
            type="text"
            placeholder="e.g., Pilot Superstore"
            className={errors.businessName ? 'border-destructive focus:ring-destructive/20' : ''}
            {...register('businessName')}
          />
          {errors.businessName && <p className="text-xs text-destructive mt-1.5">{errors.businessName.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Admin Full Name</label>
          <Input
            type="text"
            placeholder="e.g., Mahmud Rasel"
            className={errors.name ? 'border-destructive focus:ring-destructive/20' : ''}
            {...register('name')}
          />
          {errors.name && <p className="text-xs text-destructive mt-1.5">{errors.name.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Email</label>
          <Input
            type="email"
            placeholder="rasel@stockpilot.com"
            className={errors.email ? 'border-destructive focus:ring-destructive/20' : ''}
            {...register('email')}
          />
          {errors.email && <p className="text-xs text-destructive mt-1.5">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Password</label>
          <Input
            type="password"
            placeholder="••••••••"
            className={errors.password ? 'border-destructive focus:ring-destructive/20' : ''}
            {...register('password')}
          />
          {errors.password && <p className="text-xs text-destructive mt-1.5">{errors.password.message}</p>}
        </div>

        <Button type="submit" className="w-full py-2.5 h-11 text-sm font-semibold mt-4 transition-all" disabled={isSubmitting}>
          {isSubmitting ? 'Registering...' : 'Register'}
        </Button>
      </form>

      <div className="mt-8 text-center text-xs text-muted-foreground">
        <span>Already have an account? </span>
        <Link href="/login" className="text-primary font-semibold hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
}
