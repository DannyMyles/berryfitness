import clsx from 'clsx';
import { CURRENCY_SYMBOL } from '@/app/lib/money';

const SIZES = {
  sm: { currency: 'text-[0.6rem] mt-0.5', amount: 'text-lg' },
  md: { currency: 'text-xs mt-1', amount: 'text-2xl' },
  lg: { currency: 'text-sm mt-1.5', amount: 'text-4xl' },
};

/** Shop price with a raised currency symbol, e.g. $25. */
export default function Price({ amount, size = 'md', className }: { amount: number; size?: keyof typeof SIZES; className?: string }) {
  const s = SIZES[size];
  return (
    <span className={clsx('inline-flex items-start font-semibold leading-none text-gray-900', className)}>
      <span className={clsx('mr-0.5 font-medium', s.currency)}>{CURRENCY_SYMBOL}</span>
      <span className={clsx('tracking-tight', s.amount)}>{amount.toLocaleString()}</span>
    </span>
  );
}
