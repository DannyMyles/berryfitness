'use client';

/**
 * Opening WhatsApp after an order/booking is saved.
 *
 * Browsers block `window.open` unless it runs directly inside the click
 * handler — and we only get the WhatsApp link after awaiting the API. So we
 * open a placeholder tab synchronously on click (`reserve`), then point it
 * at WhatsApp once the API answers (`send`), or close it if the request
 * failed (`cancel`). If the tab couldn't be opened at all, the confirmation
 * screen still shows an "Open WhatsApp" button.
 */
export function reserveWhatsAppTab(): Window | null {
  try {
    const tab = window.open('', '_blank');
    if (tab) {
      tab.document.title = 'Opening WhatsApp…';
      tab.document.body.innerHTML =
        '<p style="font-family:system-ui,sans-serif;text-align:center;margin-top:40vh;color:#475569">Opening WhatsApp…</p>';
    }
    return tab;
  } catch {
    return null;
  }
}

/** Sends the reserved tab to WhatsApp. Returns false if there was no tab to use. */
export function sendToWhatsApp(tab: Window | null, url: string): boolean {
  if (tab && !tab.closed) {
    tab.opener = null;
    tab.location.href = url;
    return true;
  }
  return false;
}

export function cancelWhatsAppTab(tab: Window | null) {
  if (tab && !tab.closed) tab.close();
}

/** Remembers checkout/booking contact details on this device so repeat visitors type nothing. */
const DETAILS_KEY = 'berry-contact-details';

export interface SavedContactDetails {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
}

export function loadContactDetails(): SavedContactDetails {
  try {
    return JSON.parse(window.localStorage.getItem(DETAILS_KEY) ?? '{}') as SavedContactDetails;
  } catch {
    return {};
  }
}

export function saveContactDetails(details: SavedContactDetails) {
  try {
    window.localStorage.setItem(DETAILS_KEY, JSON.stringify({ ...loadContactDetails(), ...details }));
  } catch {
    /* storage unavailable (private mode) — nothing to remember */
  }
}

export const PHONE_REGEX = /^\+?[0-9\s-]{7,20}$/;
