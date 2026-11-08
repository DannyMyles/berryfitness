'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { ArrowUpRight, LogOut, Menu, ShoppingBag, User, X } from 'lucide-react';
import { useCartStore } from '@/app/lib/cartStore';

// The logo links home; the blog and legal pages live in the footer.
const links = [
  { name: 'About', href: '/about' },
  { name: 'Services', href: '/services' },
  { name: 'Corporate', href: '/corporate' },
  { name: 'Events', href: '/events' },
  { name: 'Gallery', href: '/gallery' },
  { name: 'Shop', href: '/shop' },
  { name: 'Contact', href: '/contact' },
];

export default function Navigation() {
  const pathname = usePathname();
  const { status } = useSession();
  const cartCount = useCartStore((s) => s.count());
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
  const items = hasHydrated ? cartCount : 0;
  const accountHref = status === 'authenticated' ? '/account' : '/login';

  return (
    <header className="sticky top-0 z-50 px-3 pt-3 sm:px-4">
      <div
        className={`mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-2xl border px-3 py-2 transition-all duration-300 sm:px-4 lg:rounded-full ${
          scrolled || open
            ? 'border-gray-200/80 bg-white/85 shadow-[0_8px_30px_-12px_rgba(15,17,23,0.25)] backdrop-blur-xl'
            : 'border-transparent bg-white/60 backdrop-blur-md'
        }`}
      >
        <Link href="/" className="flex shrink-0 items-center pl-1" aria-label="Berry Fitness for Health home">
          <Image src="/images/logo.svg" alt="Berry Fitness for Health" width={389} height={167} priority className="h-11 w-auto md:h-12" />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              aria-current={isActive(l.href) ? 'page' : undefined}
              className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors ${
                isActive(l.href) ? 'bg-fitness-primary/10 font-semibold text-fitness-primary-dark' : 'text-gray-600 hover:bg-gray-100 hover:text-fitness-primary-dark'
              }`}
            >
              {l.name}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            href={accountHref}
            aria-label={status === 'authenticated' ? 'My account' : 'Log in'}
            className="hidden rounded-full p-2.5 text-gray-700 transition-colors hover:bg-gray-100 sm:inline-flex"
          >
            <User size={20} />
          </Link>
          <Link
            href="/cart"
            aria-label={items > 0 ? `Cart, ${items} items` : 'Cart'}
            className="relative rounded-full p-2.5 text-gray-700 transition-colors hover:bg-gray-100"
          >
            <ShoppingBag size={20} />
            {items > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-fitness-primary px-1 text-[11px] font-bold text-white">
                {items}
              </span>
            )}
          </Link>
          <Link
            href="/services"
            className="ml-1 hidden items-center gap-1.5 rounded-full bg-fitness-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-fitness-primary-dark md:inline-flex"
          >
            Book a session <ArrowUpRight size={16} />
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            className="rounded-full p-2.5 text-ink transition-colors hover:bg-gray-100 lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu sheet */}
      <div
        className={`fixed inset-x-3 top-[4.75rem] bottom-3 z-40 overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl transition-all duration-300 lg:hidden ${
          open ? 'visible translate-y-0 opacity-100' : 'invisible -translate-y-2 opacity-0'
        }`}
      >
        <nav aria-label="Mobile" className="flex flex-col">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`flex items-center justify-between border-b border-gray-100 py-3.5 font-display text-2xl font-bold tracking-tight ${
                isActive(l.href) ? 'text-fitness-primary' : 'text-ink'
              }`}
            >
              {l.name}
              <ArrowUpRight size={20} className="text-gray-300" />
            </Link>
          ))}
        </nav>
        <div className="mt-6 grid gap-3">
          <Link href="/services" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-fitness-primary py-3.5 font-semibold text-white">
            Book a session
          </Link>
          <Link href={accountHref} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 py-3.5 font-semibold text-ink">
            <User size={18} /> {status === 'authenticated' ? 'My account' : 'Log in'}
          </Link>
          {status === 'authenticated' && (
            <button onClick={() => signOut({ callbackUrl: '/' })} className="inline-flex items-center justify-center gap-2 py-2 text-gray-500">
              <LogOut size={16} /> Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
