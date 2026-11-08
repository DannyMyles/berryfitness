'use client';

import { money } from '@/app/lib/money'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { Package, Ticket, Loader2, MapPin, Calendar, RefreshCw, AlertCircle, LogOut } from 'lucide-react';
import PageHero from '@/components/ui/PageHero';
import EmptyState from '@/components/ui/EmptyState';
import { orderService } from '@/app/api_services/orderService';
import { eventService, MyRegistration } from '@/app/api_services/eventService';
import { Order, OrderStatus } from '@/types/commerce';

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const TICKET_STATUS_STYLES: Record<MyRegistration['status'], string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

const TICKET_STATUS_LABELS: Record<MyRegistration['status'], string> = {
  pending: 'Awaiting confirmation',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
};

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function AccountClient() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [orders, setOrders] = useState<Order[]>([]);
  const [tickets, setTickets] = useState<MyRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login?callbackUrl=/account');
    }
  }, [status, router]);

  const fetchAccountData = () => {
    setLoading(true);
    setError('');
    Promise.all([orderService.getMine(), eventService.getMyRegistrations()])
      .then(([myOrders, myTickets]) => {
        setOrders(myOrders);
        setTickets(myTickets);
      })
      .catch(() => setError('Could not load your account data. Please try again.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (status === 'authenticated') {
      fetchAccountData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-fitness-primary" />
      </div>
    );
  }

  return (
    <div className="pt-0">
      <PageHero
        title="My Account"
        subtitle={`Welcome back${session?.user?.name ? `, ${session.user.name}` : ''} — here's your order and ticket history.`}
      />

      <section className="pt-10 bg-white">
        <div className="container mx-auto px-4 max-w-4xl flex justify-end">
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:border-fitness-primary hover:text-fitness-primary transition-colors"
          >
            <LogOut size={16} />
            Log Out
          </button>
        </div>
      </section>

      <section className="py-10 bg-white">
        <div className="container mx-auto px-4 max-w-4xl space-y-16">
          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 size={32} className="animate-spin text-gray-300" />
            </div>
          ) : error ? (
            <EmptyState
              icon={AlertCircle}
              title="Couldn't load your account"
              description={error}
              action={{ label: 'Try Again', icon: RefreshCw, onClick: fetchAccountData }}
            />
          ) : (
            <>
              {/* Orders */}
              <div>
                <h2 className="text-2xl font-bold text-fitness-dark mb-6 flex items-center gap-2">
                  <Package size={24} className="text-fitness-primary" />
                  My Orders
                </h2>
                {orders.length === 0 ? (
                  <EmptyState
                    icon={Package}
                    title="No orders yet"
                    description="Items you order from the shop will show up here."
                    action={{ label: 'Browse Shop', href: '/shop' }}
                  />
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-card">
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div>
                            <p className="font-semibold text-fitness-dark">{order.orderNumber}</p>
                            <p className="text-sm text-gray-500">{formatDate(order.createdAt)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${ORDER_STATUS_STYLES[order.status]}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                          {order.items.map((item) => (
                            <p key={item.id}>
                              {item.name} × {item.quantity}
                            </p>
                          ))}
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-sm text-gray-500">
                            Payment: {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                          </span>
                          <span className="font-bold text-fitness-primary">{money(order.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Event Tickets */}
              <div>
                <h2 className="text-2xl font-bold text-fitness-dark mb-6 flex items-center gap-2">
                  <Ticket size={24} className="text-fitness-primary" />
                  My Event Tickets
                </h2>
                {tickets.length === 0 ? (
                  <EmptyState
                    icon={Ticket}
                    title="No tickets yet"
                    description="Events you register for will show up here."
                    action={{ label: 'Browse Events', href: '/events' }}
                  />
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {tickets.map((ticket) => (
                      <div key={ticket.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-card">
                        {ticket.event.image && (
                          <div className="h-32 bg-gray-100">
                            <img src={ticket.event.image} alt={ticket.event.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="p-5">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-fitness-dark">{ticket.event.title}</h3>
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${TICKET_STATUS_STYLES[ticket.status]}`}>
                              {TICKET_STATUS_LABELS[ticket.status]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-1">
                            <Calendar size={14} />
                            {formatDate(ticket.event.date)} · {ticket.event.time}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1.5 mb-3">
                            <MapPin size={14} />
                            {ticket.event.location}
                          </p>
                          <p className="text-xs font-mono text-gray-400">{ticket.ticketNumber}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
