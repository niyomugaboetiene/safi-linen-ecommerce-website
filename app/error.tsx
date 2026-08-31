'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 rounded-full mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-neutral-900 mb-3">
          Something Went Wrong
        </h1>
        <p className="text-neutral-600 mb-8">
          An unexpected error occurred. Please try again.
        </p>
        <Button onClick={reset} size="lg">
          <RefreshCw className="h-5 w-5" />
          Try Again
        </Button>
      </div>
    </div>
  );
}