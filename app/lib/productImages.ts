import type { Product } from '@/types/commerce';

/**
 * Photos for a colour: the ones tagged with it, or every photo when nothing
 * is tagged with that colour (untagged products keep working unchanged).
 */
export function imagesForColor(product: Product, color?: string): string[] {
  if (color) {
    const tagged = product.imageDetails.filter((img) => img.color === color).map((img) => img.url);
    if (tagged.length > 0) return tagged;
  }
  return product.images;
}

/** First photo of a colour, falling back to the product's main photo. */
export function colorPreview(product: Product, color?: string): string | undefined {
  return imagesForColor(product, color)[0];
}

/** "S – XXL" style summary of the available sizes. */
export function sizeRange(sizes: string[]): string {
  if (sizes.length === 0) return '';
  return sizes.length === 1 ? sizes[0] : `${sizes[0]} – ${sizes[sizes.length - 1]}`;
}

/** Products with a choice to make go through the product page before the cart. */
export function hasOptions(product: Product): boolean {
  return product.sizes.length > 0 || product.colors.length > 1;
}
