'use client';

import { useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ShoppingCart, Minus, Plus, SlidersHorizontal } from 'lucide-react';
import { Product } from '@/types/commerce';
import { useCartStore } from '@/app/lib/cartStore';
import { hasOptions, imagesForColor, sizeRange } from '@/app/lib/productImages';
import ColorSwatch from './ColorSwatch';
import Price from './Price';
import { optimizedSrc } from '@/app/lib/imageSrc';

export function productHref(product: Product, color?: string) {
  return `/shop/${product.slug}${color && product.colors.length > 1 ? `?color=${encodeURIComponent(color)}` : ''}`;
}

export default function ProductCard({ product }: { product: Product }) {
  const [activeColor, setActiveColor] = useState<string | undefined>(product.colors[0]);
  const images = imagesForColor(product, activeColor);
  const [main, hover] = images;
  const href = productHref(product, activeColor);

  const addItem = useCartStore((s) => s.addItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const hasHydrated = useCartStore((s) => s.hasHydrated);
  // Quick add only applies to products with nothing to choose, which are
  // always stored as a line with no size and the single colour (if any).
  const quickColor = product.colors.length === 1 ? product.colors[0] : undefined;
  const inCart = useCartStore((s) =>
    s.lines.find((l) => l.productId === product.id && !l.size && l.color === quickColor)?.quantity ?? 0
  );
  const quantity = hasHydrated ? inCart : 0;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white transition-shadow duration-300 hover:shadow-card-hover">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-gray-50">
        {main && (
          <img
            src={optimizedSrc(main, 640)}
            alt={`${product.name}${activeColor ? ` in ${activeColor}` : ''}`}
            loading="lazy"
            className={clsx(
              'absolute inset-0 h-full w-full object-contain p-1.5 mix-blend-multiply transition-all duration-500 group-hover:scale-105 sm:p-2',
              hover && 'group-hover:opacity-0'
            )}
          />
        )}
        {hover && (
          <img
            src={optimizedSrc(hover, 640)}
            alt=""
            aria-hidden
            loading="lazy"
            className="absolute inset-0 h-full w-full object-contain p-1.5 opacity-0 mix-blend-multiply transition-all duration-500 group-hover:scale-105 group-hover:opacity-100 sm:p-2"
          />
        )}
        <div className="absolute left-2.5 top-2.5 flex flex-col items-start gap-1.5">
          {product.isNew && (
            <span className="rounded-md bg-fitness-primary px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-white">New</span>
          )}
          {product.featured && (
            <span className="rounded-md bg-ink px-2 py-0.5 text-[0.7rem] font-semibold uppercase tracking-wide text-white">Top pick</span>
          )}
        </div>
        {!product.inStock && (
          <div className="absolute inset-x-0 bottom-0 bg-black/70 py-1.5 text-center text-xs font-semibold text-white">Out of stock</div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {product.colors.length > 1 && (
          <div className="mb-2.5 flex items-center gap-1.5" role="radiogroup" aria-label="Colour">
            {product.colors.map((color) => (
              <button
                key={color}
                type="button"
                role="radio"
                aria-checked={activeColor === color}
                aria-label={color}
                title={color}
                onMouseEnter={() => setActiveColor(color)}
                onFocus={() => setActiveColor(color)}
                onClick={() => setActiveColor(color)}
                className={clsx(
                  'rounded-full p-0.5 ring-2 transition-colors',
                  activeColor === color ? 'ring-fitness-primary' : 'ring-transparent hover:ring-gray-300'
                )}
              >
                <ColorSwatch color={color} className="h-5 w-5" />
              </button>
            ))}
            <span className="ml-1 text-xs text-gray-500">{product.colors.length} colours</span>
          </div>
        )}

        {product.category && (
          <p className="mb-1 text-[0.7rem] font-semibold uppercase tracking-wider text-gray-500">{product.category.name}</p>
        )}
        <Link href={href} className="mb-1.5">
          <h2 className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 transition-colors hover:text-fitness-primary sm:text-base">
            {product.name}
          </h2>
        </Link>
        {product.sizes.length > 0 && (
          <p className="mb-2 text-xs text-gray-500">Sizes {sizeRange(product.sizes)}</p>
        )}

        <div className="mb-3 mt-auto flex items-end justify-between gap-2">
          <Price amount={product.price} size="sm" />
          <span className={clsx('text-xs font-medium', product.inStock ? 'text-fitness-accent' : 'text-red-600')}>
            {product.inStock ? 'In stock' : 'Sold out'}
          </span>
        </div>

        {hasOptions(product) ? (
          <Link
            href={href}
            className={clsx(
              'flex items-center justify-center gap-2 rounded-full border-2 border-gray-900 px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-900 hover:text-white',
              !product.inStock && 'pointer-events-none opacity-50'
            )}
          >
            <SlidersHorizontal size={16} className="hidden sm:block" />
            <span className="sm:hidden">Options</span>
            <span className="hidden sm:inline">Choose options</span>
          </Link>
        ) : quantity > 0 ? (
          <div className="flex items-center justify-between rounded-full bg-gray-100 p-1">
            <button
              type="button"
              aria-label="Remove one"
              onClick={() => setQuantity(product.id, quantity - 1, undefined, quickColor)}
              className="rounded-full p-1.5 transition-colors hover:bg-white hover:text-fitness-primary"
            >
              <Minus size={16} />
            </button>
            <span className="text-sm font-semibold">{quantity} in cart</span>
            <button
              type="button"
              aria-label="Add one"
              onClick={() => addItem(product, 1, undefined, quickColor)}
              className="rounded-full p-1.5 transition-colors hover:bg-white hover:text-fitness-primary"
            >
              <Plus size={16} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => addItem(product, 1, undefined, quickColor)}
            disabled={!product.inStock}
            className="flex items-center justify-center gap-2 rounded-full bg-fitness-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-fitness-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={16} />
            Add to Cart
          </button>
        )}
      </div>
    </article>
  );
}
