'use client';

import { money } from '@/app/lib/money'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import {
  ShoppingCart, Trash2, Plus, Minus, ArrowLeft, CheckCircle, Loader2, AlertCircle, MessageCircle, ShieldCheck,
} from 'lucide-react';
import { useCartStore } from '@/app/lib/cartStore';
import { orderService } from '@/app/api_services/orderService';
import { CreateOrderResponse } from '@/types/commerce';
import {
  PHONE_REGEX,
  cancelWhatsAppTab,
  loadContactDetails,
  reserveWhatsAppTab,
  saveContactDetails,
  sendToWhatsApp,
} from '@/app/lib/whatsappHandoff';
import { optimizedSrc } from '@/app/lib/imageSrc';

const inputClass =
  'w-full px-4 py-3 border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-fitness-primary focus:border-transparent transition';

/**
 * One-page checkout: review the cart and fill three fields on the same
 * screen, then "Order on WhatsApp". The order is saved (server-priced) and
 * WhatsApp opens with the full summary so the customer just taps Send —
 * delivery and payment are agreed in that chat. No login required.
 */
export default function CartClient() {
  const { data: session } = useSession();
  const [details, setDetails] = useState({ name: '', phone: '', email: '', address: '', notes: '' });
  const [fieldError, setFieldError] = useState<{ field?: string; message: string } | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placed, setPlaced] = useState<CreateOrderResponse | null>(null);
  const [whatsappOpened, setWhatsappOpened] = useState(false);

  const lines = useCartStore((s) => s.lines);
  const removeItem = useCartStore((s) => s.removeItem);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const clearCart = useCartStore((s) => s.clear);
  const subtotal = useCartStore((s) => s.subtotal());
  const itemCount = useCartStore((s) => s.count());
  const hasHydrated = useCartStore((s) => s.hasHydrated);

  // Prefill from this device's last checkout, then the signed-in account.
  useEffect(() => {
    const saved = loadContactDetails();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDetails((d) => ({
      ...d,
      name: d.name || saved.name || session?.user?.name || '',
      phone: d.phone || saved.phone || '',
      email: d.email || saved.email || session?.user?.email || '',
      address: d.address || saved.address || '',
    }));
  }, [session?.user?.name, session?.user?.email]);

  const update = (field: keyof typeof details) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDetails((d) => ({ ...d, [field]: e.target.value }));
    if (fieldError?.field === field) setFieldError(null);
  };

  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!PHONE_REGEX.test(details.phone.trim())) {
      setFieldError({ field: 'phone', message: 'Please enter a valid phone number, e.g. 0712 345 678' });
      return;
    }

    setFieldError(null);
    setIsPlacingOrder(true);
    const tab = reserveWhatsAppTab();
    try {
      const result = await orderService.createOrder({
        customerName: details.name.trim(),
        customerPhone: details.phone.trim(),
        customerEmail: details.email.trim() || undefined,
        shippingAddress: details.address.trim(),
        notes: details.notes.trim() || undefined,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, size: l.size, color: l.color })),
      });
      saveContactDetails({
        name: details.name.trim(),
        phone: details.phone.trim(),
        email: details.email.trim(),
        address: details.address.trim(),
      });
      if (result.whatsapp) {
        setWhatsappOpened(sendToWhatsApp(tab, result.whatsapp.url));
      } else {
        cancelWhatsAppTab(tab);
      }
      setPlaced(result);
      clearCart();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      cancelWhatsAppTab(tab);
      setFieldError({ message: err instanceof Error ? err.message : 'Could not place your order. Please try again.' });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (placed) {
    return (
      <div className="pt-8 min-h-screen bg-gray-50">
        <section className="py-16">
          <div className="container mx-auto px-4 max-w-xl">
            <div className="bg-white rounded-2xl shadow-card p-8 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40} className="text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-fitness-dark mb-2">Order received!</h1>
              <p className="text-gray-600 mb-1">
                Your order number is <span className="font-semibold text-fitness-dark">{placed.order.orderNumber}</span>.
              </p>
              <p className="text-gray-600 mb-6">
                {whatsappOpened
                  ? 'WhatsApp has opened with your order — just tap Send and we’ll confirm delivery and payment.'
                  : 'Send it to us on WhatsApp and we’ll confirm delivery and payment.'}
              </p>

              <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 divide-y divide-gray-200">
                {placed.order.items.map((i) => (
                  <div key={i.id} className="flex justify-between gap-4 py-2 text-sm">
                    <span className="text-gray-700">
                      {i.name}
                      {[i.color, i.size].filter(Boolean).length > 0 && (
                        <span className="text-gray-400"> ({[i.color, i.size].filter(Boolean).join(' / ')})</span>
                      )}{' '}
                      × {i.quantity}
                    </span>
                    <span className="font-medium whitespace-nowrap">{money((i.price * i.quantity))}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 font-bold">
                  <span>Total</span>
                  <span className="text-fitness-primary">{money(placed.order.total)}</span>
                </div>
              </div>

              {placed.whatsapp && (
                <a
                  href={placed.whatsapp.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F7A6E] hover:bg-[#0B5F55] text-white font-semibold py-4 transition-colors"
                >
                  <MessageCircle size={20} />
                  {whatsappOpened ? 'Open WhatsApp again' : 'Send order on WhatsApp'}
                </a>
              )}
              <Link href="/shop" className="inline-block mt-4 text-gray-600 hover:text-fitness-primary transition-colors">
                Continue shopping
              </Link>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="pt-8 min-h-screen bg-gray-50">
      <section className="py-10 bg-white border-b">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-fitness-dark">
            Your <span className="text-fitness-primary">Cart</span>
          </h1>
          <p className="text-gray-500 mt-2">Review your items, add your details and order in one tap on WhatsApp.</p>
        </div>
      </section>

      <section className="py-10">
        <div className="container mx-auto px-4">
          {!hasHydrated ? (
            <div className="bg-white rounded-2xl shadow-card p-12 text-center max-w-xl mx-auto">
              <Loader2 size={32} className="mx-auto animate-spin text-gray-300" />
            </div>
          ) : lines.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-12 text-center max-w-xl mx-auto">
              <ShoppingCart size={48} className="mx-auto text-gray-300 mb-4" />
              <h2 className="text-xl font-bold text-fitness-dark mb-2">Your cart is empty</h2>
              <p className="text-gray-600 mb-6">Browse the shop to add some Berry Fitness gear.</p>
              <Link href="/shop" className="btn-fitness">
                Go to Shop
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
              {/* Items */}
              <div className="lg:col-span-3 bg-white rounded-2xl shadow-card overflow-hidden">
                <div className="p-5 border-b flex items-center justify-between">
                  <h2 className="text-lg font-bold text-fitness-dark">
                    {itemCount} {itemCount === 1 ? 'item' : 'items'}
                  </h2>
                  <Link
                    href="/shop"
                    className="inline-flex items-center gap-1.5 text-sm text-fitness-primary font-medium hover:text-fitness-primary-dark"
                  >
                    <ArrowLeft size={16} />
                    Keep shopping
                  </Link>
                </div>

                <ul className="divide-y">
                  {lines.map((item) => (
                    <li key={`${item.productId}-${item.size}-${item.color}`} className="p-4 sm:p-5 flex gap-4">
                      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={optimizedSrc(item.image, 384)} alt={item.name} className="w-full h-full object-contain p-1.5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-fitness-dark truncate">{item.name}</h3>
                            <p className="text-sm text-gray-500">
                              {[item.color, item.size].filter(Boolean).join(' / ')}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.productId, item.size, item.color)}
                            className="p-2 -m-2 text-gray-400 hover:text-red-500 transition-colors"
                            aria-label={`Remove ${item.name}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>

                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center rounded-lg border border-gray-200">
                            <button
                              type="button"
                              onClick={() => setQuantity(item.productId, item.quantity - 1, item.size, item.color)}
                              className="p-2 hover:bg-gray-50 rounded-l-lg"
                              aria-label="Decrease quantity"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="w-9 text-center font-medium text-sm">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => setQuantity(item.productId, Math.min(50, item.quantity + 1), item.size, item.color)}
                              className="p-2 hover:bg-gray-50 rounded-r-lg"
                              aria-label="Increase quantity"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <div className="font-bold text-fitness-primary">
                            {money((item.price * item.quantity))}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Details + place order */}
              <form onSubmit={placeOrder} className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6 lg:sticky lg:top-24 space-y-4">
                <h2 className="text-lg font-bold text-fitness-dark">Your details</h2>

                <div>
                  <label htmlFor="co-name" className="block text-sm font-medium text-gray-700 mb-1">Full name</label>
                  <input id="co-name" type="text" required maxLength={100} autoComplete="name"
                    value={details.name} onChange={update('name')} className={inputClass} placeholder="Jane Wanjiku" />
                </div>
                <div>
                  <label htmlFor="co-phone" className="block text-sm font-medium text-gray-700 mb-1">Phone (WhatsApp)</label>
                  <input id="co-phone" type="tel" required maxLength={20} autoComplete="tel" inputMode="tel"
                    value={details.phone} onChange={update('phone')}
                    className={`${inputClass} ${fieldError?.field === 'phone' ? 'border-red-400' : ''}`}
                    placeholder="0712 345 678" aria-invalid={fieldError?.field === 'phone'} />
                </div>
                <div>
                  <label htmlFor="co-address" className="block text-sm font-medium text-gray-700 mb-1">Delivery location</label>
                  <input id="co-address" type="text" required maxLength={400} autoComplete="street-address"
                    value={details.address} onChange={update('address')} className={inputClass}
                    placeholder="e.g. Westlands, Nairobi" />
                </div>
                <details className="group">
                  <summary className="cursor-pointer text-sm text-fitness-primary font-medium select-none">
                    Add email or a note (optional)
                  </summary>
                  <div className="space-y-3 mt-3">
                    <input type="email" maxLength={255} autoComplete="email" value={details.email}
                      onChange={update('email')} className={inputClass} placeholder="Email for a receipt" aria-label="Email" />
                    <textarea maxLength={500} rows={2} value={details.notes} onChange={update('notes')}
                      className={inputClass} placeholder="Delivery instructions, preferred time…" aria-label="Notes" />
                  </div>
                </details>

                <div className="border-t pt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span>{money(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery</span>
                    <span>Agreed on WhatsApp</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-1">
                    <span>Total</span>
                    <span className="text-fitness-primary">{money(subtotal)}</span>
                  </div>
                </div>

                {fieldError && (
                  <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2">
                    <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-red-600">{fieldError.message}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isPlacingOrder}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F7A6E] hover:bg-[#0B5F55] text-white font-semibold py-4 transition-colors disabled:opacity-60"
                >
                  {isPlacingOrder ? <Loader2 className="animate-spin" size={20} /> : <MessageCircle size={20} />}
                  {isPlacingOrder ? 'Placing order…' : 'Order on WhatsApp'}
                </button>
                <p className="flex items-center justify-center gap-1.5 text-xs text-gray-500 text-center">
                  <ShieldCheck size={14} />
                  No payment now — we confirm stock, delivery and payment with you on WhatsApp.
                </p>
              </form>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
