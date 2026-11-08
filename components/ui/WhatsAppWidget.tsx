'use client';

import SharedWhatsAppWidget from '@/components/site/WhatsAppWidget';
import { useSite } from '@/components/site/SiteProvider';

// Hidden where it would get in the way: the admin area, checkout (which
// already ends on WhatsApp) and the sign-in pages.
const HIDDEN_ON = ['/admin', '/cart', '/login', '/register', '/forgot-password', '/reset-password'];

const WhatsAppWidget = () => {
  const { name } = useSite();
  return (
    <SharedWhatsAppWidget
      hiddenOn={HIDDEN_ON}
      greeting="Hi there! 👋 How can we help with your fitness journey today?"
      options={[
        { label: 'Book a training session', message: `Hi ${name}! I'd like to book a training session. When are you available?` },
        { label: 'Corporate wellness / team building', message: `Hi ${name}! I'd like a quote for corporate wellness or team building. Company: , group size: ` },
        { label: 'Help with a shop order', message: `Hi ${name}! I need help with a shop order.` },
        { label: 'Something else', message: `Hi ${name}! I have a question.` },
      ]}
    />
  );
};

export default WhatsAppWidget;
