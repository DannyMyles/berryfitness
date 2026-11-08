import { ImageResponse } from 'next/og';
import { BrandOgCard } from '@/app/lib/ogImage';

export const runtime = 'edge';
export const alt = 'Berry Fitness for Health — Body Goals and Health';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function TwitterImage() {
  return new ImageResponse(<BrandOgCard />, { ...size });
}
