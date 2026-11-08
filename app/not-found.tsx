import Link from 'next/link';
import { Home, ShoppingBag, Calendar, Dumbbell } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-br from-fitness-light via-white to-fitness-primary/5 px-4">
      <div className="text-center max-w-lg">
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-fitness-primary to-fitness-primary-dark flex items-center justify-center shadow-fitness-lg">
          <Dumbbell size={40} className="text-white" />
        </div>
        <p className="text-7xl font-bold text-fitness-primary mb-2">404</p>
        <h1 className="text-2xl md:text-3xl font-bold text-fitness-dark mb-3">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or may have moved. Let's get you back on track.
        </p>

        <Link href="/" className="btn-primary inline-flex items-center gap-2 mb-8">
          <Home size={18} />
          Back to Home
        </Link>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-fitness-primary hover:text-fitness-primary transition-colors"
          >
            <ShoppingBag size={16} />
            Shop
          </Link>
          <Link
            href="/events"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-fitness-primary hover:text-fitness-primary transition-colors"
          >
            <Calendar size={16} />
            Events
          </Link>
        </div>
      </div>
    </div>
  );
}
