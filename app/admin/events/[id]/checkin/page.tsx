'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, CheckCircle2, XCircle, AlertTriangle, Clock3, Camera, KeyboardIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { eventService, CheckinOutcome, EventRegistration } from '@/app/api_services/eventService'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

interface LogEntry {
  id: string
  ticketNumber: string
  attendeeName: string
  outcome: CheckinOutcome
  at: string
}

const OUTCOME_META: Record<CheckinOutcome, { label: string; icon: typeof CheckCircle2; classes: string }> = {
  checked_in: { label: 'Checked in', icon: CheckCircle2, classes: 'bg-green-50 border-green-200 text-green-800' },
  already_checked_in: { label: 'Already checked in', icon: Clock3, classes: 'bg-amber-50 border-amber-200 text-amber-800' },
  blocked_unconfirmed: { label: 'Booking not confirmed yet', icon: AlertTriangle, classes: 'bg-red-50 border-red-200 text-red-800' },
  blocked_cancelled: { label: 'Ticket cancelled', icon: XCircle, classes: 'bg-red-50 border-red-200 text-red-800' },
}

const SCAN_COOLDOWN_MS = 2500

export default function EventCheckinPage() {
  useDocumentTitle('Event Check-in')
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const eventId = params.id

  const [manualTicket, setManualTicket] = useState('')
  const [checking, setChecking] = useState(false)
  const [lastResult, setLastResult] = useState<{ registration: EventRegistration; outcome: CheckinOutcome } | null>(null)
  const [log, setLog] = useState<LogEntry[]>([])
  const [cameraError, setCameraError] = useState('')
  const [cameraStarted, setCameraStarted] = useState(false)

  const scannerRef = useRef<any>(null)
  const cooldownRef = useRef(false)
  const readerId = 'checkin-qr-reader'

  const performCheckin = async (ticketNumber: string) => {
    if (!ticketNumber.trim() || cooldownRef.current) return
    cooldownRef.current = true
    setChecking(true)
    try {
      const result = await eventService.checkIn(eventId, ticketNumber.trim())
      setLastResult(result)
      setLog((prev) => [
        {
          id: `${result.registration.id}-${Date.now()}`,
          ticketNumber: result.registration.ticketNumber,
          attendeeName: result.registration.attendeeName,
          outcome: result.outcome,
          at: new Date().toLocaleTimeString(),
        },
        ...prev,
      ])
      if (result.outcome === 'checked_in') {
        toast.success(`${result.registration.attendeeName} checked in`)
      } else if (result.outcome === 'already_checked_in') {
        toast(`${result.registration.attendeeName} was already checked in`, { icon: '⏱️' })
      } else {
        toast.error(OUTCOME_META[result.outcome].label)
      }
    } catch (error: any) {
      toast.error(error.message || 'Ticket not found')
      setLastResult(null)
    } finally {
      setChecking(false)
      setTimeout(() => {
        cooldownRef.current = false
      }, SCAN_COOLDOWN_MS)
    }
  }

  useEffect(() => {
    let cancelled = false

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      if (cancelled) return
      const scanner = new Html5Qrcode(readerId)
      scannerRef.current = scanner
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            performCheckin(decodedText)
          },
          () => {
            // Per-frame "no QR found" callback — expected constantly while
            // idle, not an error worth surfacing.
          }
        )
        .then(() => {
          if (!cancelled) setCameraStarted(true)
        })
        .catch((err: any) => {
          if (!cancelled) setCameraError(err?.message || 'Could not access the camera. Use manual entry below.')
        })
    })

    return () => {
      cancelled = true
      const scanner = scannerRef.current
      if (scanner && scanner.isScanning) {
        scanner.stop().catch(() => {})
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="space-y-6 p-4">
      <button
        onClick={() => router.push(`/admin/events/${eventId}/registrations`)}
        className="inline-flex items-center gap-2 text-accent-600 hover:text-accent-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Registrations
      </button>

      <div>
        <h1 className="text-3xl font-bold text-gray-900">Check-in Station</h1>
        <p className="mt-1 text-gray-600">Scan a ticket's QR code, or type the ticket number, to check an attendee in.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-adventure border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent-600" />
              Scan QR Code
            </h2>
            <div id={readerId} className="rounded-lg overflow-hidden bg-gray-900 min-h-[260px]" />
            {cameraError && (
              <p className="text-sm text-red-600 mt-3">{cameraError}</p>
            )}
            {!cameraStarted && !cameraError && (
              <p className="text-sm text-gray-500 mt-3">Starting camera…</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-adventure border border-gray-200 p-6">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <KeyboardIcon className="h-5 w-5 text-accent-600" />
              Manual Entry
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                performCheckin(manualTicket)
                setManualTicket('')
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={manualTicket}
                onChange={(e) => setManualTicket(e.target.value)}
                placeholder="EVT-XXXXXXXXX"
                disabled={checking}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 font-mono"
              />
              <button
                type="submit"
                disabled={checking || !manualTicket.trim()}
                className="btn-primary px-6 disabled:opacity-50"
              >
                Check In
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          {lastResult && (
            <div className={`rounded-xl border-2 p-6 ${OUTCOME_META[lastResult.outcome].classes}`}>
              <div className="flex items-center gap-3 mb-3">
                {(() => {
                  const Icon = OUTCOME_META[lastResult.outcome].icon
                  return <Icon className="h-8 w-8" />
                })()}
                <div>
                  <p className="text-lg font-bold">{OUTCOME_META[lastResult.outcome].label}</p>
                  <p className="text-sm opacity-80">{lastResult.registration.ticketNumber}</p>
                </div>
              </div>
              <p className="font-medium">{lastResult.registration.attendeeName}</p>
              <p className="text-sm opacity-80">{lastResult.registration.attendeePhone}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-adventure border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Session Log</h2>
              <p className="text-sm text-gray-500">{log.length} scan(s) this session</p>
            </div>
            {log.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-10">No check-ins yet</p>
            ) : (
              <div className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto">
                {log.map((entry) => {
                  const meta = OUTCOME_META[entry.outcome]
                  const Icon = meta.icon
                  return (
                    <div key={entry.id} className="px-6 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Icon className={`h-4 w-4 shrink-0 ${meta.classes.includes('green') ? 'text-green-600' : meta.classes.includes('amber') ? 'text-amber-600' : 'text-red-600'}`} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{entry.attendeeName}</p>
                          <p className="text-xs text-gray-400 font-mono">{entry.ticketNumber}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-400">{entry.at}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
