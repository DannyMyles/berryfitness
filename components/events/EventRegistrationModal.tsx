'use client';

import { money } from '@/app/lib/money'
import { useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Loader2, AlertCircle, CheckCircle, X, Minus, Plus, MessageCircle, Calendar, MapPin } from 'lucide-react';
import { eventService, EventItem, RegistrationResponse } from '@/app/api_services/eventService';
import { newRequestId } from '@/app/lib/enquiries';
import {
  PHONE_REGEX,
  cancelWhatsAppTab,
  loadContactDetails,
  reserveWhatsAppTab,
  saveContactDetails,
  sendToWhatsApp,
} from '@/app/lib/whatsappHandoff';

interface EventRegistrationModalProps {
  event: EventItem;
  onClose: () => void;
  // Lets the caller refresh its own copy of the event (e.g. updated
  // spotsRemaining) once a booking goes through.
  onRegistered?: () => void;
}

/**
 * Booking in one short form (name, phone, how many people) — no account
 * and no online payment. The booking is saved, then WhatsApp opens with the
 * booking summary so the customer taps Send and we confirm the spot there.
 * Shared by the events list and the event detail page.
 */
export default function EventRegistrationModal({ event, onClose, onRegistered }: EventRegistrationModalProps) {
  const { data: session } = useSession();
  const maxParticipants = Math.max(1, Math.min(20, event.spotsRemaining));

  const [attendeeName, setAttendeeName] = useState('');
  const requestId = useRef(newRequestId());
  const [attendeePhone, setAttendeePhone] = useState('');
  const [participants, setParticipants] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [booked, setBooked] = useState<RegistrationResponse | null>(null);
  const [whatsappOpened, setWhatsappOpened] = useState(false);

  useEffect(() => {
    const saved = loadContactDetails();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAttendeeName((n) => n || saved.name || session?.user?.name || '');
    setAttendeePhone((p) => p || saved.phone || '');
  }, [session?.user?.name]);

  // Close on Escape. Callers pass onClose inline, so read it through a ref.
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCloseRef.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const total = event.price * participants;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!PHONE_REGEX.test(attendeePhone.trim())) {
      setFormError('Please enter a valid phone number, e.g. 0712 345 678');
      return;
    }
    setIsSubmitting(true);
    const tab = reserveWhatsAppTab();
    try {
      const result = await eventService.register(event.slug, {
        attendeeName: attendeeName.trim(),
        attendeePhone: attendeePhone.trim(),
        participants,
        requestId: requestId.current,
      });
      saveContactDetails({ name: attendeeName.trim(), phone: attendeePhone.trim() });
      if (result.whatsapp) setWhatsappOpened(sendToWhatsApp(tab, result.whatsapp.url));
      else cancelWhatsAppTab(tab);
      setBooked(result);
      onRegistered?.();
    } catch (err) {
      cancelWhatsAppTab(tab);
      setFormError(err instanceof Error ? err.message : 'Could not complete your booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="booking-title"
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl max-w-md w-full p-6 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h3 id="booking-title" className="text-xl font-bold text-gray-900">
              {booked ? 'Spot reserved!' : event.title}
            </h3>
            {!booked && (
              <p className="mt-1 text-sm text-gray-500 flex flex-wrap gap-x-3 gap-y-1">
                <span className="inline-flex items-center gap-1">
                  <Calendar size={14} /> {eventService.formatDate(event.date)}, {event.time}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {event.location}
                </span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-2 -m-1 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Close">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {booked ? (
          <div className="text-center py-2">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-600" />
            </div>
            <p className="text-gray-700 mb-1">
              Booking reference <span className="font-mono font-semibold">{booked.registration.ticketNumber}</span>
            </p>
            <p className="text-sm text-gray-500 mb-6">
              {whatsappOpened
                ? 'WhatsApp has opened with your booking — tap Send and we’ll confirm your spot.'
                : 'Send your booking to us on WhatsApp and we’ll confirm your spot.'}
            </p>
            {booked.whatsapp && (
              <a
                href={booked.whatsapp.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F7A6E] hover:bg-[#0B5F55] text-white font-semibold py-3.5 transition-colors"
              >
                <MessageCircle size={20} />
                {whatsappOpened ? 'Open WhatsApp again' : 'Send booking on WhatsApp'}
              </a>
            )}
            <button onClick={onClose} className="mt-3 w-full py-2 text-gray-600 hover:text-fitness-primary transition-colors">
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="bk-name" className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
              <input id="bk-name" type="text" required maxLength={100} autoComplete="name"
                value={attendeeName} onChange={(e) => setAttendeeName(e.target.value)} className="form-input" />
            </div>
            <div>
              <label htmlFor="bk-phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone (WhatsApp)</label>
              <input id="bk-phone" type="tel" required maxLength={20} autoComplete="tel" inputMode="tel"
                value={attendeePhone} onChange={(e) => setAttendeePhone(e.target.value)}
                placeholder="0712 345 678" className="form-input" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">People</span>
              <div className="flex items-center rounded-xl border border-gray-200">
                <button type="button" onClick={() => setParticipants((n) => Math.max(1, n - 1))}
                  className="p-2.5 hover:bg-gray-50 rounded-l-xl disabled:opacity-40" disabled={participants <= 1} aria-label="Fewer people">
                  <Minus size={16} />
                </button>
                <span className="w-10 text-center font-semibold" aria-live="polite">{participants}</span>
                <button type="button" onClick={() => setParticipants((n) => Math.min(maxParticipants, n + 1))}
                  className="p-2.5 hover:bg-gray-50 rounded-r-xl disabled:opacity-40" disabled={participants >= maxParticipants} aria-label="More people">
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 flex justify-between gap-4">
              <span>{event.price > 0 ? `${money(event.price)} × ${participants}` : 'Price confirmed on WhatsApp'}</span>
              {event.price > 0 && <span className="font-bold text-gray-900">{money(total)}</span>}
            </div>

            {formError && (
              <div role="alert" className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2 text-sm text-red-600">
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                {formError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#0F7A6E] hover:bg-[#0B5F55] text-white font-semibold py-3.5 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <MessageCircle size={18} />}
              {isSubmitting ? 'Booking…' : 'Book on WhatsApp'}
            </button>
            <p className="text-xs text-gray-500 text-center">
              No payment now — we confirm your spot{event.price > 0 ? ' and payment' : ''} on WhatsApp.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
