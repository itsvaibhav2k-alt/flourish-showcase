import Link from 'next/link';
import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-white">
      <div className="text-8xl font-bold text-neutral-200 mb-4">404</div>
      <h1 className="text-2xl font-semibold text-neutral-900 mb-2">Page not found</h1>
      <p className="text-neutral-600 mb-8 max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Button asChild>
        <Link href="/">
          <Home className="w-4 h-4 mr-2" />
          Go home
        </Link>
      </Button>
    </div>
  );
}
