'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GlobalError({
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
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
      <AlertTriangle className="w-16 h-16 text-amber-500 mb-6" />
      <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Something went wrong</h1>
      <p className="text-neutral-600 mb-8 max-w-md">
        We encountered an unexpected error. Please try again.
      </p>
      <div className="flex gap-4">
        <Button onClick={reset} variant="default">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">
            <Home className="w-4 h-4 mr-2" />
            Go home
          </Link>
        </Button>
      </div>
      {error.digest && (
        <p className="mt-6 text-xs text-neutral-400">Error ID: {error.digest}</p>
      )}
    </div>
  );
}
