// Product colors are stored as plain names (e.g. "Black", "White") — this
// maps the names actually used in the catalog to a swatch background.
// Unrecognized names fall back to a neutral gray rather than breaking.

const COLOR_HEX_MAP: Record<string, string> = {
  Black: '#111111',
  White: '#FFFFFF',
};

const FALLBACK_SWATCH = '#9CA3AF';
const MULTI_SWATCH = 'conic-gradient(from 0deg, #007AA9, #10B981, #3B82F6, #007AA9)';

export function getColorSwatch(name: string): string {
  if (name === 'Multi') return MULTI_SWATCH;
  return COLOR_HEX_MAP[name] ?? FALLBACK_SWATCH;
}
