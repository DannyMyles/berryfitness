import clsx from 'clsx';
import { getColorSwatch } from '@/app/lib/colorSwatches';

/** Round colour dot; light colours get a border so they show on white. */
export default function ColorSwatch({ color, className }: { color: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={clsx('block rounded-full', color === 'White' ? 'ring-1 ring-inset ring-gray-300' : '', className)}
      style={{ background: getColorSwatch(color) }}
    />
  );
}
