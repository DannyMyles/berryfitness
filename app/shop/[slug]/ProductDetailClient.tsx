'use client';

import { money, CURRENCY } from '@/app/lib/money'
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import {
  ShoppingCart, X, ChevronLeft, ChevronRight, Loader2, AlertCircle, Check,
  ArrowLeft, MessageCircle, Wallet, ShieldCheck, Zap,
} from 'lucide-react';
import { productService } from '@/app/api_services/productService';
import { useCartStore } from '@/app/lib/cartStore';
import { colorPreview, imagesForColor } from '@/app/lib/productImages';
import { useSite } from '@/components/site/SiteProvider';
import Price from '@/components/shop/Price';
import ProductCard from '@/components/shop/ProductCard';
import { ProductDetail } from '@/types/commerce';
import { optimizedSrc } from '@/app/lib/imageSrc';

const MAX_QUANTITY = 10;

export default function ProductDetailClient({ slug, initialColor }: { slug: string; initialColor?: string }) {
  const router = useRouter();
  const site = useSite();
  const addItem = useCartStore((s) => s.addItem);

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedColor, setSelectedColor] = useState<string | undefined>(undefined);
  const [previewColor, setPreviewColor] = useState<string | undefined>(undefined);
  const [selectedSize, setSelectedSize] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);
  const [imageIndex, setImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const [validationError, setValidationError] = useState('');
  const [justAdded, setJustAdded] = useState(false);
  const sizeSectionRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  // Hovering a colour previews its photos (as on Amazon); the gallery
  // returns to the selected colour when the pointer leaves.
  const galleryColor = previewColor ?? selectedColor;
  const images = product ? imagesForColor(product, galleryColor) : [];
  const currentImage = images[Math.min(imageIndex, images.length - 1)];

  useEffect(() => {
    setIsLoading(true);
    setError('');
    productService
      .getProduct(slug)
      .then((p) => {
        setProduct(p);
        setSelectedColor(initialColor && p.colors.includes(initialColor) ? initialColor : p.colors[0]);
        setSelectedSize(p.sizes.length === 1 ? p.sizes[0] : undefined);
        setImageIndex(0);
      })
      .catch(() => setError('This product could not be found.'))
      .finally(() => setIsLoading(false));
  }, [slug, initialColor]);

  useEffect(() => {
    setImageIndex(0);
  }, [galleryColor]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, images.length]);

  const step = (delta: number) => {
    if (images.length < 2) return;
    setImageIndex((i) => (i + delta + images.length) % images.length);
  };

  const chooseColor = (color: string) => {
    setSelectedColor(color);
    setPreviewColor(undefined);
    setValidationError('');
    if (product && product.colors.length > 1) {
      router.replace(`/shop/${product.slug}?color=${encodeURIComponent(color)}`, { scroll: false });
    }
  };

  const handleAddToCart = (goToCart: boolean) => {
    if (!product) return;
    if (product.colors.length > 0 && !selectedColor) {
      setValidationError('Please select a colour.');
      return;
    }
    if (product.sizes.length > 0 && !selectedSize) {
      setValidationError('Please select a size.');
      sizeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setValidationError('');
    addItem(product, quantity, selectedSize, selectedColor);

    if (goToCart) {
      router.push('/cart');
      return;
    }
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1800);
  };

  const onZoomMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setZoom({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    });
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32 text-gray-400">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="container mx-auto px-4 py-32 text-center">
        <AlertCircle size={40} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600 mb-6">{error || 'Product not found.'}</p>
        <Link href="/shop" className="btn-fitness inline-flex items-center gap-2">
          <ArrowLeft size={18} />
          Back to Shop
        </Link>
      </div>
    );
  }

  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    brand: { '@type': 'Brand', name: site.name },
    image: product.images.map((src) => `${typeof window !== 'undefined' ? window.location.origin : ''}${src}`),
    offers: {
      '@type': 'Offer',
      priceCurrency: CURRENCY,
      price: product.price,
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  const highlights = [
    product.description,
    product.colors.length > 0 && `Available in ${product.colors.join(' and ')}.`,
    product.sizes.length > 0 && `Sizes ${product.sizes.join(', ')}.`,
    'Order on WhatsApp — no account needed. Pay once your order is confirmed.',
  ].filter(Boolean) as string[];

  const details: [string, string][] = [
    ['Brand', site.name],
    ...(product.category ? [['Category', product.category.name] as [string, string]] : []),
    ...(product.colors.length > 0 ? [['Colours', product.colors.join(', ')] as [string, string]] : []),
    ...(product.sizes.length > 0 ? [['Sizes', product.sizes.join(', ')] as [string, string]] : []),
    ['Availability', product.inStock ? 'In stock' : 'Out of stock'],
  ];

  const addLabel = justAdded ? 'Added to Cart' : 'Add to Cart';

  return (
    <div className="bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />

      {isLightboxOpen && (
        <div
          role="dialog"
          aria-label={`${product.name} photos`}
          className="fixed inset-0 z-100 flex flex-col bg-black/95"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="flex items-center justify-between p-4 text-sm text-white/70">
            <span>{imageIndex + 1} / {images.length}</span>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setIsLightboxOpen(false)}
              className="rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
            >
              <X size={22} />
            </button>
          </div>
          <div className="relative flex min-h-0 flex-1 items-center justify-center px-4">
            {images.length > 1 && (
              <button
                type="button"
                aria-label="Previous photo"
                onClick={(e) => { e.stopPropagation(); step(-1); }}
                className="absolute left-3 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 md:left-8"
              >
                <ChevronLeft size={28} />
              </button>
            )}
            <img
              src={optimizedSrc(currentImage, 1920)}
              alt={product.name}
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            {images.length > 1 && (
              <button
                type="button"
                aria-label="Next photo"
                onClick={(e) => { e.stopPropagation(); step(1); }}
                className="absolute right-3 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 md:right-8"
              >
                <ChevronRight size={28} />
              </button>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex justify-center gap-2 overflow-x-auto p-4" onClick={(e) => e.stopPropagation()}>
              {images.map((img, index) => (
                <button
                  key={img}
                  type="button"
                  onClick={() => setImageIndex(index)}
                  className={clsx(
                    'h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-white ring-2 transition',
                    index === imageIndex ? 'ring-fitness-primary' : 'ring-transparent opacity-60 hover:opacity-100'
                  )}
                >
                  <img src={optimizedSrc(img, 384)} alt="" className="h-full w-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="container mx-auto px-4 pb-28 pt-4 lg:pb-16">
        <nav aria-label="Breadcrumb" className="mb-5 flex items-center gap-1.5 overflow-hidden text-xs text-gray-500 sm:text-sm">
          <Link href="/shop" className="shrink-0 hover:text-fitness-primary hover:underline">Shop</Link>
          {product.category && (
            <>
              <ChevronRight size={14} className="shrink-0" />
              <span className="shrink-0">{product.category.name}</span>
            </>
          )}
          <ChevronRight size={14} className="shrink-0" />
          <span className="truncate text-gray-800">{product.name}</span>
        </nav>

        <div className="grid gap-8 lg:grid-cols-12 lg:gap-10">
          {/* Gallery */}
          <section aria-label="Product photos" className="lg:col-span-7 lg:row-span-2 xl:col-span-5">
            <div className="lg:sticky lg:top-24">
              <div className="flex gap-3">
                {images.length > 1 && (
                  <div className="hidden w-16 shrink-0 flex-col gap-2 md:flex">
                    {images.map((img, index) => (
                      <button
                        key={img}
                        type="button"
                        aria-label={`Show photo ${index + 1}`}
                        onMouseEnter={() => setImageIndex(index)}
                        onClick={() => setImageIndex(index)}
                        className={clsx(
                          'aspect-square overflow-hidden rounded-lg border-2 bg-gray-50 transition-colors',
                          index === imageIndex ? 'border-fitness-primary' : 'border-gray-200 hover:border-gray-400'
                        )}
                      >
                        <img src={optimizedSrc(img, 384)} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                      </button>
                    ))}
                  </div>
                )}

                <div
                  className="relative aspect-square flex-1 cursor-zoom-in overflow-hidden rounded-2xl bg-gray-50"
                  onClick={() => setIsLightboxOpen(true)}
                  onMouseMove={onZoomMove}
                  onMouseLeave={() => setZoom(null)}
                  onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
                  onTouchEnd={onTouchEnd}
                >
                  {currentImage && (
                    <img
                      key={currentImage}
                      src={optimizedSrc(currentImage, 1200)}
                      alt={`${product.name}${galleryColor ? ` in ${galleryColor}` : ''}`}
                      className="h-full w-full object-contain mix-blend-multiply transition-transform duration-200 ease-out"
                      style={zoom ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                    />
                  )}
                  {(product.isNew || product.featured) && (
                    <div className="pointer-events-none absolute left-3 top-3 flex gap-1.5">
                      {product.isNew && <span className="rounded-md bg-fitness-primary px-2 py-0.5 text-xs font-semibold uppercase text-white">New</span>}
                      {product.featured && <span className="rounded-md bg-ink px-2 py-0.5 text-xs font-semibold uppercase text-white">Top pick</span>}
                    </div>
                  )}
                  {images.length > 1 && (
                    <>
                      <button
                        type="button"
                        aria-label="Previous photo"
                        onClick={(e) => { e.stopPropagation(); step(-1); }}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-700 shadow md:hidden"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        type="button"
                        aria-label="Next photo"
                        onClick={(e) => { e.stopPropagation(); step(1); }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-1.5 text-gray-700 shadow md:hidden"
                      >
                        <ChevronRight size={20} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {images.length > 1 && (
                <div className="mt-3 flex justify-center gap-1.5 md:hidden" aria-hidden>
                  {images.map((img, index) => (
                    <span key={img} className={clsx('h-1.5 rounded-full transition-all', index === imageIndex ? 'w-5 bg-fitness-primary' : 'w-1.5 bg-gray-300')} />
                  ))}
                </div>
              )}
              <p className="mt-2 hidden text-center text-xs text-gray-500 md:block">Roll over image to zoom in · click to open full view</p>
            </div>
          </section>

          {/* Details */}
          <section className="lg:col-span-5 xl:col-span-4">
            <Link href="/shop" className="text-sm font-medium text-fitness-primary hover:underline">
              Visit the {site.name} store
            </Link>
            <h1 className="mt-1 text-2xl font-semibold leading-tight text-gray-900 md:text-3xl">{product.name}</h1>
            {product.category && <p className="mt-1.5 text-sm text-gray-500">{product.category.name}</p>}

            <div className="my-4 border-t border-gray-200" />

            <Price amount={product.price} size="lg" />
            <p className="mt-2 text-sm text-gray-600">No upfront payment — pay once your order is confirmed.</p>

            <div className="my-4 border-t border-gray-200" />

            {product.colors.length > 0 && (
              <div className="mb-6">
                <p className="mb-2.5 text-sm text-gray-700">
                  Colour: <span className="font-semibold text-gray-900">{previewColor ?? selectedColor}</span>
                </p>
                <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label="Colour" onMouseLeave={() => setPreviewColor(undefined)}>
                  {product.colors.map((color) => {
                    const preview = colorPreview(product, color);
                    const active = selectedColor === color;
                    return (
                      <button
                        key={color}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onMouseEnter={() => setPreviewColor(color)}
                        onFocus={() => setPreviewColor(color)}
                        onBlur={() => setPreviewColor(undefined)}
                        onClick={() => chooseColor(color)}
                        className={clsx(
                          'w-21 overflow-hidden rounded-xl border-2 bg-white text-left transition-all',
                          active ? 'border-fitness-primary shadow-[0_0_0_3px_rgba(0,122,169,0.15)]' : 'border-gray-200 hover:border-gray-400'
                        )}
                      >
                        <span className="block aspect-square bg-gray-50">
                          {preview && <img src={optimizedSrc(preview, 384)} alt="" className="h-full w-full object-contain mix-blend-multiply" />}
                        </span>
                        <span className="flex items-center justify-between gap-1 border-t border-gray-100 px-2 py-1.5 text-xs font-medium text-gray-800">
                          {color}
                          {active && <Check size={13} className="text-fitness-primary" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {product.sizes.length > 0 && (
              <div ref={sizeSectionRef} className="mb-6">
                <p className="mb-2.5 text-sm text-gray-700">
                  Size: <span className="font-semibold text-gray-900">{selectedSize ?? 'Select a size'}</span>
                </p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      role="radio"
                      aria-checked={selectedSize === size}
                      onClick={() => { setSelectedSize(size); setValidationError(''); }}
                      className={clsx(
                        'h-10 min-w-13 rounded-lg border-2 px-3 text-sm font-medium transition-colors',
                        selectedSize === size
                          ? 'border-fitness-primary bg-fitness-primary/10 text-fitness-primary'
                          : 'border-gray-200 text-gray-700 hover:border-gray-400',
                        validationError && !selectedSize && 'border-red-300'
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="my-4 border-t border-gray-200" />

            <h2 className="mb-2 text-base font-semibold text-gray-900">About this item</h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-gray-700">
              {highlights.map((line) => <li key={line}>{line}</li>)}
            </ul>
          </section>

          {/* Buy box */}
          <aside className="lg:col-span-5 lg:col-start-8 xl:col-span-3 xl:col-start-10 xl:row-start-1">
            <div className="rounded-2xl border border-gray-200 p-5 lg:sticky lg:top-24">
              <Price amount={product.price * quantity} size="md" />
              {quantity > 1 && (
                <p className="mt-1 text-xs text-gray-500">{quantity} × {money(product.price)}</p>
              )}
              <p className={clsx('mt-3 text-base font-semibold', product.inStock ? 'text-fitness-accent' : 'text-red-600')}>
                {product.inStock ? 'In Stock' : 'Currently unavailable'}
              </p>

              {(selectedColor || selectedSize) && (
                <p className="mt-1 text-sm text-gray-600">
                  {[selectedColor, selectedSize && `Size ${selectedSize}`].filter(Boolean).join(' · ')}
                </p>
              )}

              <label className="mt-4 flex items-center gap-2 text-sm text-gray-700">
                Quantity:
                <select
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  disabled={!product.inStock}
                  className="rounded-lg border border-gray-300 bg-gray-50 py-1.5 pl-3 pr-8 text-sm focus:border-fitness-primary focus:outline-none focus:ring-2 focus:ring-fitness-primary/30"
                >
                  {Array.from({ length: MAX_QUANTITY }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </label>

              {validationError && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                  <AlertCircle size={16} className="shrink-0" />
                  {validationError}
                </div>
              )}

              <div className="mt-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAddToCart(false)}
                  disabled={!product.inStock}
                  className="flex items-center justify-center gap-2 rounded-full bg-fitness-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-fitness-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {justAdded ? <Check size={18} /> : <ShoppingCart size={18} />}
                  {addLabel}
                </button>
                <button
                  type="button"
                  onClick={() => handleAddToCart(true)}
                  disabled={!product.inStock}
                  className="flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Zap size={18} />
                  Buy Now
                </button>
              </div>

              <ul className="mt-5 space-y-3 border-t border-gray-100 pt-4 text-sm text-gray-600">
                <li className="flex gap-2.5"><MessageCircle size={18} className="shrink-0 text-fitness-accent" />Order confirmed with you on WhatsApp</li>
                <li className="flex gap-2.5"><Wallet size={18} className="shrink-0 text-fitness-accent" />No upfront payment — pay once confirmed</li>
                <li className="flex gap-2.5"><ShieldCheck size={18} className="shrink-0 text-fitness-accent" />Durable stitching for indoor and outdoor training</li>
              </ul>
            </div>
          </aside>
        </div>

        <section className="mt-14 border-t border-gray-200 pt-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-900">Product details</h2>
          <dl className="max-w-2xl divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 text-sm">
            {details.map(([label, value]) => (
              <div key={label} className="grid grid-cols-3 gap-4 px-4 py-3">
                <dt className="font-semibold text-gray-700">{label}</dt>
                <dd className="col-span-2 text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        {product.related.length > 0 && (
          <section className="mt-14 border-t border-gray-200 pt-8">
            <h2 className="mb-5 text-xl font-semibold text-gray-900">You may also like</h2>
            <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-4">
              {product.related.map((related) => (
                <ProductCard key={related.id} product={related} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Mobile buy bar; right padding leaves room for the WhatsApp button */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t border-gray-200 bg-white/95 py-3 pl-4 pr-22 backdrop-blur lg:hidden">
        <div className="min-w-0 flex-1">
          <Price amount={product.price} size="sm" />
          <p className="truncate text-xs text-gray-500">
            {[selectedColor, selectedSize ? `Size ${selectedSize}` : product.sizes.length > 0 && 'Choose a size'].filter(Boolean).join(' · ')}
          </p>
        </div>
        <button
          type="button"
          onClick={() => handleAddToCart(false)}
          disabled={!product.inStock}
          className="flex shrink-0 items-center gap-2 rounded-full bg-fitness-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
        >
          {justAdded ? <Check size={16} /> : <ShoppingCart size={16} />}
          {justAdded ? 'Added' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
