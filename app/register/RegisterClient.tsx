'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/app/lib/api';

const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export default function RegisterClient() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character (@$!%*?&)');
      return;
    }

    setIsLoading(true);

    try {
      const username = email.split('@')[0];
      await api.public.auth.register({ name, username, email, password });
      // New accounts start unverified — auto sign-in would fail until the
      // verification link is clicked, so send them there instead.
      setRegistered(true);
    } catch (err: any) {
      setError(err?.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fitness-dark via-fitness-secondary to-fitness-dark flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-fitness-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-fitness-accent/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/images/logo-white.svg" alt="Berry Fitness for Health" width={389} height={167} priority className="h-20 w-auto" />
          </Link>
        </div>

        {/* Register Form */}
        <div className="bg-white rounded-2xl shadow-fitness-lg p-8">
          {registered ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-gradient-to-br from-fitness-primary to-fitness-primary-dark rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-fitness-dark mb-2">Check Your Email</h1>
              <p className="text-gray-600 mb-6">
                We've sent a verification link to <strong>{email}</strong>. Verify your email, then sign in.
              </p>
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="btn-primary inline-flex items-center justify-center py-3 px-6"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-fitness-dark mb-2">Create Your Account</h1>
            <p className="text-gray-600">Sign up to start your fitness journey</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <AlertCircle size={20} className="text-red-500" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fitness-primary transition-colors"
                  placeholder="Jane Doe"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fitness-primary transition-colors"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fitness-primary transition-colors"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {password && (
                <ul className="mt-2 space-y-1">
                  {[
                    { label: 'At least 8 characters', met: password.length >= 8 },
                    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
                    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
                    { label: 'One number', met: /\d/.test(password) },
                    { label: 'One special character (@$!%*?&)', met: /[@$!%*?&]/.test(password) },
                  ].map((req) => (
                    <li
                      key={req.label}
                      className={`flex items-center gap-2 text-xs ${req.met ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {req.met ? (
                        <CheckCircle size={14} />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-current" />
                      )}
                      {req.label}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fitness-primary transition-colors"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <p className="text-xs text-gray-500 text-center">
              By creating an account, you agree to our{' '}
              <Link href="/terms-and-conditions" className="text-fitness-primary hover:underline">
                Terms & Conditions
              </Link>{' '}
              and{' '}
              <Link href="/privacy-policy" className="text-fitness-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-4 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link
                href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
                className="text-fitness-primary font-medium hover:underline"
              >
                Sign In
              </Link>
            </p>
          </div>
            </>
          )}
        </div>

        {/* Back to Home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}
