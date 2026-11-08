'use client';

import { usePageHeader } from '@/components/site/SiteProvider';
import { money, CURRENCY } from '@/app/lib/money'
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingCart, Shield, RefreshCw, Dumbbell, Loader2, Search, AlertCircle, MessageCircle, Wallet, ArrowUpDown } from 'lucide-react';
import { productService } from '@/app/api_services/productService';
import { useCartStore } from '@/app/lib/cartStore';
import { Category, Product } from '@/types/commerce';
import EmptyState from '@/components/ui/EmptyState';
import ProductCard from '@/components/shop/ProductCard';

// Hero collage: featured products (Admin → Products → Featured); these until loaded.
const TILE_STYLES = [
  { rotate: '-rotate-3', z: 'z-20' },
  { rotate: 'rotate-2', z: 'z-10' },
  { rotate: '-rotate-2', z: 'z-0' },
];
const FALLBACK_TILES = [
  { src: '/images/shop/t-shirt.jpg', rotate: '-rotate-3', z: 'z-20' },
  { src: '/images/shop/hoodie.jpg', rotate: 'rotate-2', z: 'z-10' },
  { src: '/images/shop/ladies-croptop.jpg', rotate: '-rotate-2', z: 'z-0' },
];

const SORTS = {
  featured: { label: 'Featured', compare: (a: Product, b: Product) => Number(b.featured) - Number(a.featured) },
  newest: { label: 'Newest arrivals', compare: (a: Product, b: Product) => Number(b.isNew) - Number(a.isNew) || b.createdAt.localeCompare(a.createdAt) },
  'price-asc': { label: 'Price: low to high', compare: (a: Product, b: Product) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', compare: (a: Product, b: Product) => b.price - a.price },
};
type SortKey = keyof typeof SORTS;

export default function ShopClient() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [heroImages, setHeroImages] = useState<string[]>(FALLBACK_TILES.map((t) => t.src));
  const shopHead = usePageHeader('shop', { eyebrow: '', title: '', highlight: '', subtitle: '' });
  const heroTiles = heroImages.map((src, i) => ({ src, ...TILE_STYLES[i] }));

  const [sort, setSort] = useState<SortKey>('featured');
  const subtotal = useCartStore((s) => s.subtotal());
  const cartCount = useCartStore((s) => s.count());
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  useEffect(() => {
    productService
      .getCategories()
      .then(setCategories)
      .catch(() => setError('Could not load categories.'));
    productService
      .getProducts({})
      .then((all) => {
        const picks = [...all.filter((p) => p.featured), ...all.filter((p) => !p.featured)]
          .map((p) => p.images[0])
          .filter(Boolean)
          .slice(0, 3);
        if (picks.length === 3) setHeroImages(picks);
      })
      .catch(() => {});
  }, []);

  const fetchProducts = () => {
    setIsLoading(true);
    setError('');
    productService
      .getProducts({ category: activeCategory, search: searchQuery })
      .then(setProducts)
      .catch(() => setError('Could not load products. Is the commerce API running?'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    setIsLoading(true);
    setError('');
    const timeout = setTimeout(fetchProducts, 250); // debounce search typing
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory, searchQuery]);

  // Array.prototype.sort is stable, so ties keep the API's order.
  const sortedProducts = useMemo(() => [...products].sort(SORTS[sort].compare), [products, sort]);

  const productsJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.images[0] ? `${typeof window !== 'undefined' ? window.location.origin : ''}${product.images[0]}` : undefined,
        offers: {
          '@type': 'Offer',
          priceCurrency: CURRENCY,
          price: product.price,
          availability: product.inStock
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        },
      },
    })),
  };

  return (
    <div className="pt-0">
      {products.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productsJsonLd) }}
        />
      )}
      {/* Hero Section — bento panel */}
      <section className="pt-3 pb-2 md:pb-4">
        <div className="mx-auto max-w-7xl px-3 sm:px-4">
          <div className="relative rounded-4xl overflow-hidden bg-ink px-6 py-8 md:px-16 md:py-20">
            <div className="pointer-events-none absolute -right-20 -top-24 h-96 w-96 rounded-full bg-fitness-primary/40 blur-3xl" aria-hidden />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-64 w-64 rounded-full bg-fitness-primary/15 blur-3xl" aria-hidden />
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              <div className="lg:col-span-7">
                <div className="eyebrow mb-4 md:mb-6 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-fitness-primary-light">
                  <span className="h-1.5 w-1.5 rounded-full bg-fitness-primary" />
                  {shopHead.eyebrow}
                </div>
                <h1 className="font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.02] mb-3 md:mb-5">
                  {shopHead.title}<br /><span className="text-fitness-primary">{shopHead.highlight}</span>
                </h1>
                <p className="text-base md:text-lg text-white/70 max-w-lg leading-relaxed">
                  {shopHead.subtitle}
                </p>
              </div>
              <div className="hidden md:block lg:col-span-5 relative h-80" aria-hidden>
                {heroTiles.map((tile, i) => (
                  <div
                    key={tile.src}
                    className={`absolute ${tile.z} ${tile.rotate} w-44 h-52 md:w-56 md:h-64 rounded-2xl overflow-hidden shadow-2xl bg-white border-4 border-white/10`}
                    style={{ left: `${i * 26}%`, top: i % 2 ? '10%' : '0' }}
                  >
                    <Image src={tile.src} alt="" fill className="object-contain p-2" sizes="260px" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="py-4 md:py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 md:p-4">
              <div className="w-11 h-11 bg-fitness-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageCircle size={22} className="text-fitness-primary" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Order on WhatsApp</p>
                <p className="text-xs text-gray-500">No account needed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 md:p-4">
              <div className="w-11 h-11 bg-fitness-accent/10 rounded-xl flex items-center justify-center flex-shrink-0">
                <Shield size={22} className="text-fitness-accent" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Durable Stitching</p>
                <p className="text-xs text-gray-500">Indoor and outdoor wear</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 md:p-4">
              <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Wallet size={22} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">No Upfront Payment</p>
                <p className="text-xs text-gray-500">Pay once confirmed</p>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-white rounded-2xl p-3 md:p-4">
              <div className="w-11 h-11 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Dumbbell size={22} className="text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">Lightweight & Flexible</p>
                <p className="text-xs text-gray-500">Moves with your body</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Section */}
      <section className="pt-4 pb-16 md:pt-8 md:pb-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-5 lg:gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-3xl p-4 md:p-6 shadow-card lg:sticky lg:top-24">
                <div className="mb-4 md:mb-6 relative">
                  <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-fitness-primary focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <h3 className="hidden lg:block font-semibold text-gray-800 mb-4">Categories</h3>
                  <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 lg:mx-0 lg:px-0 lg:flex-wrap lg:overflow-visible [scrollbar-width:none]">
                    <button
                      onClick={() => setActiveCategory('All')}
                      className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        activeCategory === 'All'
                          ? 'bg-fitness-primary text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All ({categories.reduce((sum, c) => sum + c.productCount, 0)})
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.slug}
                        onClick={() => setActiveCategory(category.slug)}
                        className={`shrink-0 whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                          activeCategory === category.slug
                            ? 'bg-fitness-primary text-white shadow-sm'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {category.name} ({category.productCount})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Products Grid */}
            <div className="lg:w-3/4">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-gray-600">
                  {isLoading ? 'Loading products…' : (
                    <><span className="font-semibold text-gray-900">{products.length}</span> {products.length === 1 ? 'product' : 'products'}</>
                  )}
                </p>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <ArrowUpDown size={16} className="text-gray-400" />
                  <span className="hidden sm:inline">Sort by</span>
                  <select
                    aria-label="Sort products"
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortKey)}
                    className="rounded-full border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm font-medium text-gray-800 focus:border-fitness-primary focus:outline-none focus:ring-2 focus:ring-fitness-primary/30"
                  >
                    {(Object.keys(SORTS) as SortKey[]).map((key) => (
                      <option key={key} value={key}>{SORTS[key].label}</option>
                    ))}
                  </select>
                </label>
              </div>

              {error ? (
                <EmptyState
                  icon={AlertCircle}
                  title="Couldn't load products"
                  description={error}
                  action={{ label: 'Try Again', icon: RefreshCw, onClick: fetchProducts }}
                />
              ) : isLoading ? (
                <div className="flex items-center justify-center py-24 text-gray-400">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : products.length === 0 ? (
                searchQuery || activeCategory !== 'All' ? (
                  <EmptyState
                    icon={Search}
                    title="No products match your search"
                    description="Try a different search term or category."
                    action={{
                      label: 'Clear Filters',
                      onClick: () => {
                        setSearchQuery('');
                        setActiveCategory('All');
                      },
                    }}
                  />
                ) : (
                  <EmptyState
                    icon={Dumbbell}
                    title="No products yet"
                    description="New Berry Fitness gear is on the way — check back soon."
                  />
                )
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3">
                  {sortedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Cart Button */}
      {hasHydrated && cartCount > 0 && (
        <Link
          href="/cart"
          className="fixed bottom-24 right-6 z-40 bg-fitness-primary text-white px-6 py-3 rounded-full shadow-fitness-lg flex items-center gap-2 hover:bg-fitness-primary-dark transition-colors"
        >
          <ShoppingCart size={20} />
          <span className="font-semibold">{cartCount} items</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">
            {money(subtotal)}
          </span>
        </Link>
      )}
    </div>
  );
}
