'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Mail, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { api } from '@/app/lib/api';

type Status = 'loading' | 'success' | 'error';

export default function VerifyEmailClient() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setError('This verification link is missing a token.');
      return;
    }
    api.public.auth
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: any) => {
        setStatus('error');
        setError(err?.message || 'This verification link is invalid or has expired.');
      });
  }, [token]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResending(true);
    setResendMessage('');
    try {
      const res: any = await api.public.auth.resendVerification(resendEmail);
      setResendMessage(res?.message || 'If an account exists for that email, a new link has been sent.');
    } catch (err: any) {
      setResendMessage(err?.message || 'Could not resend the verification email. Please try again.');
    } finally {
      setIsResending(false);
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
          {status === 'loading' && (
            <div className="text-center py-4">
              <Loader2 size={32} className="mx-auto animate-spin text-fitness-primary mb-6" />
              <h1 className="text-2xl font-bold text-fitness-dark mb-2">Verifying your email…</h1>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-gradient-to-br from-fitness-primary to-fitness-primary-dark rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-fitness-dark mb-2">Email Verified</h1>
              <p className="text-gray-600 mb-6">You can now sign in to your account.</p>
              <Link href="/login" className="btn-primary inline-flex items-center justify-center py-3 px-6">
                Sign In
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="py-2">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
                <h1 className="text-2xl font-bold text-fitness-dark mb-2">Verification Failed</h1>
                <p className="text-gray-600">{error}</p>
              </div>

              {resendMessage ? (
                <div className="p-4 bg-fitness-primary/10 border border-fitness-primary/20 rounded-xl flex items-center gap-3">
                  <Mail size={20} className="text-fitness-primary shrink-0" />
                  <p className="text-sm text-fitness-dark">{resendMessage}</p>
                </div>
              ) : (
                <form onSubmit={handleResend} className="space-y-3">
                  <label className="block text-sm font-medium text-gray-700">
                    Enter your email to get a new verification link
                  </label>
                  <input
                    type="email"
                    required
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-fitness-primary transition-colors"
                    placeholder="you@example.com"
                  />
                  <button
                    type="submit"
                    disabled={isResending}
                    className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isResending ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      'Resend Verification Email'
                    )}
                  </button>
                </form>
              )}
            </div>
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
