'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/app/lib/api';

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await api.public.auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-fitness-dark via-fitness-secondary to-fitness-dark flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-fitness-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-fitness-accent/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3">
            <Image src="/images/logo-white.svg" alt="Berry Fitness for Health" width={389} height={167} priority className="h-20 w-auto" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl shadow-fitness-lg p-8">
          {submitted ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-gradient-to-br from-fitness-primary to-fitness-primary-dark rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-fitness-dark mb-2">Check Your Email</h1>
              <p className="text-gray-600 mb-6">
                If an account exists for <strong>{email}</strong>, we've sent a link to reset your password.
              </p>
              <Link href="/login" className="text-fitness-primary font-medium hover:underline">
                Back to Sign In
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-fitness-dark mb-2">Forgot Password?</h1>
                <p className="text-gray-600">Enter your email and we'll send you a reset link</p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
                  <AlertCircle size={20} className="text-red-500" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
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

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full btn-primary py-4 flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-fitness-primary font-medium hover:underline">
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
            ← Back to Website
          </Link>
        </div>
      </div>
    </div>
  );
}
