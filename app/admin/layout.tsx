'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import {
  LayoutDashboard, Users, ShoppingBag, FileText, Inbox, CalendarCheck, Settings, Megaphone, Send, Store,
  LogOut, Menu, X, Dumbbell, ShoppingCart, Loader2, Tags, Calendar, Image as ImageIcon, Home, Mail, Quote
} from 'lucide-react';
import { Toaster as KitToaster } from '@/components/admin-kit/ui';

const sidebarGroups = [
  {
    title: 'Overview',
    links: [
      { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
      { icon: CalendarCheck, label: 'Bookings', href: '/admin/bookings' },
      { icon: Inbox, label: 'Enquiries & quotes', href: '/admin/enquiries' },
    ],
  },
  {
    title: 'Offerings',
    links: [
      { icon: Dumbbell, label: 'Services & packages', href: '/admin/services' },
      { icon: Calendar, label: 'Events', href: '/admin/events' },
    ],
  },
  {
    title: 'Shop',
    links: [
      { icon: Store, label: 'Shop overview', href: '/admin/shop' },
      { icon: ShoppingCart, label: 'Orders', href: '/admin/orders' },
      { icon: ShoppingBag, label: 'Products', href: '/admin/products' },
      { icon: Tags, label: 'Categories', href: '/admin/categories' },
    ],
  },
  {
    title: 'Website',
    links: [
      { icon: Megaphone, label: 'FAQs & banners', href: '/admin/content' },
      { icon: FileText, label: 'Blog', href: '/admin/blog' },
      { icon: Quote, label: 'Testimonials', href: '/admin/blog/testimonials' },
      { icon: ImageIcon, label: 'Gallery', href: '/admin/gallery' },
      { icon: Mail, label: 'Newsletter', href: '/admin/newsletter' },
    ],
  },
  {
    title: 'System',
    links: [
      { icon: Users, label: 'Users', href: '/admin/users' },
      { icon: Send, label: 'Email log', href: '/admin/emails' },
      { icon: Settings, label: 'Settings', href: '/admin/settings' },
    ],
  },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname() || '';
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAdmin = status === 'authenticated' && session?.user?.role === 'admin';

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
    } else if (status === 'authenticated' && session?.user?.role !== 'admin') {
      router.replace('/');
    }
  }, [status, session, router, pathname]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-gray-500">
          <Loader2 size={32} className="animate-spin text-fitness-primary" />
          <p>{status === 'loading' ? 'Loading...' : 'Redirecting...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <KitToaster />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: { borderRadius: '12px', padding: '12px 16px' },
          success: { iconTheme: { primary: '#007AA9', secondary: '#fff' } },
        }}
      />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-br from-[#0B1A22] to-[#1F3541] text-white z-50 transform transition-transform duration-300 lg:translate-x-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-white/10">
          <Link href="/admin" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#007AA9] to-[#00668E] rounded-lg flex items-center justify-center">
              <Dumbbell size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold">Berry<span className="text-[#31A8F0]"> Admin</span></span>
          </Link>
        </div>

        <nav className="absolute top-[89px] bottom-[215px] left-0 right-0 overflow-y-auto py-4" aria-label="Admin">
          {sidebarGroups.map((group) => (
          <div key={group.title} className="mb-3">
          <p className="px-6 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/35">{group.title}</p>
          {group.links.map((link) => {
            const isActive =
              link.href === '/admin'
                ? pathname === '/admin'
                : (pathname === link.href || pathname.startsWith(link.href + '/')) &&
                  !(link.href === '/admin/blog' && pathname.startsWith('/admin/blog/testimonials'));
            return (
              <Link
                key={link.label}
                href={link.href}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-2.5 transition-all duration-200 ${
                  isActive 
                    ? 'bg-[#007AA9]/20 text-white border-l-4 border-[#007AA9]' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <link.icon size={18} />
                <span className="text-sm">{link.label}</span>
              </Link>
            );
          })}
          </div>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-white/10 space-y-1">
          <Link href="/" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors py-1">
            <Home size={20} />
            <span>Back to Website</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full flex items-center gap-3 text-gray-400 hover:text-white transition-colors py-1"
          >
            <LogOut size={20} />
            <span>Log Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between px-6 py-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu size={24} className="text-gray-700" />
            </button>
            
            <div className="flex items-center gap-4 ml-auto">
              <span className="hidden sm:block text-sm text-gray-600">{session?.user?.name || session?.user?.email}</span>
              <div className="w-10 h-10 bg-gradient-to-br from-[#007AA9] to-[#00668E] rounded-full flex items-center justify-center text-white font-semibold shadow-lg">
                {(session?.user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-red-600"
                title="Log Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

