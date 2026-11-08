/**
 * Resized, compressed (WebP/AVIF) version of a site image, upload or gallery
 * photo via Next's built-in optimiser, cached after the first request.
 * External URLs are returned unchanged.
 * `width` must be one of Next's configured image sizes.
 */
export type ImageWidth = 384 | 640 | 828 | 1080 | 1200 | 1920;

export function optimizedSrc(src: string | null | undefined, width: ImageWidth = 640): string {
  if (!src) return '';
  if (!/^\/(images\/|uploads\/|api\/v1\/(gallery|events)\/)/.test(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=75`;
}
