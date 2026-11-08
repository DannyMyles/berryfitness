'use client'

import { money } from '@/app/lib/money'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Mail, Phone, Ticket, CheckCircle, XCircle, Clock, ScanLine, BadgeCheck } from 'lucide-react'
import toast from 'react-hot-toast'
import { EventRegistration, eventService } from '@/app/api_services/eventService'
import EmptyState from '@/components/ui/EmptyState'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

export default function EventRegistrationsPage() {
  useDocumentTitle('Event Registrations')
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string

  const [registrations, setRegistrations] = useState<EventRegistration[]>([])
  const [loading, setLoading] = useState(true)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  useEffect(() => {
    fetchRegistrations()
  }, [eventId])

  const fetchRegistrations = async () => {
    try {
      setLoading(true)
      const response = await eventService.getRegistrations(eventId)
      setRegistrations(response.registrations)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load registrations')
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (registrationId: string, status: 'confirmed' | 'cancelled') => {
    setUpdatingId(registrationId)
    try {
      await eventService.updateRegistrationStatus(registrationId, status)
      toast.success(`Ticket marked ${status}`)
      setRegistrations((prev) =>
        prev.map((r) => (r.id === registrationId ? { ...r, status } : r))
      )
    } catch (error: any) {
      toast.error(error.message || 'Failed to update ticket')
    } finally {
      setUpdatingId(null)
    }
  }

  const statusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3" /> Confirmed
          </span>
        )
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
            <XCircle className="h-3 w-3" /> Cancelled
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3" /> Awaiting confirmation
          </span>
        )
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500">
        <Loader2 size={32} className="animate-spin mb-4 text-accent-500" />
        <p>Loading registrations...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/admin/events')} className="p-2 hover:bg-accent-50 rounded-lg transition-colors">
          <ArrowLeft className="h-5 w-5 text-accent-600" />
        </button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Registrations</h1>
          <p className="mt-1 text-gray-600">{registrations.length} attendee(s) registered</p>
        </div>
        <Link
          href={`/admin/events/${eventId}/checkin`}
          className="btn-primary flex items-center gap-2 w-fit"
        >
          <ScanLine className="h-5 w-5" />
          Check-in Station
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-adventure border border-gray-200 overflow-hidden">
        {registrations.length === 0 ? (
          <EmptyState
            icon={Ticket}
            title="No registrations yet"
            description="Registrations for this event will show up here as people sign up."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Attendee</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Contact</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Reference</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Checked In</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {registrations.map((reg) => (
                  <tr key={reg.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{reg.attendeeName}</p>
                      <p className="text-xs text-gray-500">
                        {reg.participants} {reg.participants === 1 ? 'person' : 'people'}
                        {reg.total > 0 && ` · ${money(reg.total)}`}
                      </p>
                      <p className="text-xs text-gray-400">{eventService.formatDate(reg.createdAt)}</p>
                      {reg.notes && <p className="text-xs text-gray-500 italic mt-1">“{reg.notes}”</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Mail className="h-3.5 w-3.5" /> {reg.attendeeEmail || '—'}
                      </div>
                      <a
                        href={`https://wa.me/${reg.attendeePhone.replace(/\D/g, '').replace(/^0(?=\d{9}$)/, '254')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-700 mt-1"
                        title="Chat on WhatsApp"
                      >
                        <Phone className="h-3.5 w-3.5" /> {reg.attendeePhone}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-sm text-gray-700">{reg.ticketNumber}</span>
                    </td>
                    <td className="px-6 py-4">{statusBadge(reg.status)}</td>
                    <td className="px-6 py-4">
                      {reg.checkedInAt ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                          <BadgeCheck className="h-3 w-3" /> {new Date(reg.checkedInAt).toLocaleTimeString()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Not yet</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {reg.status !== 'confirmed' && (
                          <button
                            onClick={() => handleStatusChange(reg.id, 'confirmed')}
                            disabled={updatingId === reg.id}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            Mark Confirmed
                          </button>
                        )}
                        {reg.status !== 'cancelled' && (
                          <button
                            onClick={() => handleStatusChange(reg.id, 'cancelled')}
                            disabled={updatingId === reg.id}
                            className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
