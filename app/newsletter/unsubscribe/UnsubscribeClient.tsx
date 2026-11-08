'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { newsletterService } from '@/app/api_services/newsletterService';

type Status = 'loading' | 'success' | 'error';

export default function UnsubscribeClient() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState<Status>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!email || !token) {
      setStatus('error');
      setError('This unsubscribe link is missing information.');
      return;
    }
    newsletterService
      .unsubscribe(email, token)
      .then(() => setStatus('success'))
      .catch((err: any) => {
        setStatus('error');
        setError(err?.message || 'This unsubscribe link is invalid or has expired.');
      });
  }, [email, token]);

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
              <h1 className="text-2xl font-bold text-fitness-dark mb-2">Unsubscribing…</h1>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-gradient-to-br from-fitness-primary to-fitness-primary-dark rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={32} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold text-fitness-dark mb-2">You're unsubscribed</h1>
              <p className="text-gray-600 mb-6">{email} won't receive any more newsletter emails from us.</p>
              <Link href="/" className="btn-primary inline-flex items-center justify-center py-3 px-6">
                Back to Website
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-red-500" />
              </div>
              <h1 className="text-2xl font-bold text-fitness-dark mb-2">Something Went Wrong</h1>
              <p className="text-gray-600">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
