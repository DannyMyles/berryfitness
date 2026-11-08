'use client'

import { money } from '@/app/lib/money'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  X,
  RefreshCw,
  Calendar,
  Users,
  FileText,
  Star,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { EventItem, eventService } from '@/app/api_services/eventService'
import EmptyState from '@/components/ui/EmptyState'
import BulkActionBar from '@/components/ui/BulkActionBar'
import BulkDeleteModal from '@/components/ui/BulkDeleteModal'
import { useBulkSelection } from '@/app/lib/useBulkSelection'
import { runBulkDelete } from '@/app/lib/bulkDelete'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

export default function EventsManagementPage() {
  useDocumentTitle('Events')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowDeleteModal(false)
      }
    }
    if (showDeleteModal) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDeleteModal])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await eventService.getAllEvents()
      setEvents(response.events)
    } catch (error: any) {
      console.error('Error fetching events:', error)
      toast.error(error.message || 'Failed to load events')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchEvents()
  }

  const handleDeleteClick = (event: EventItem) => {
    setEventToDelete(event)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!eventToDelete) return
    setDeleting(true)
    try {
      await eventService.deleteEvent(eventToDelete.id)
      toast.success('Event deleted successfully')
      setEvents((prev) => prev.filter((e) => e.id !== eventToDelete.id))
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete event')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      setEventToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setEventToDelete(null)
  }

  const handleTogglePublished = async (event: EventItem) => {
    try {
      await eventService.updateEvent(event.id, { published: !event.published })
      toast.success(`Event ${!event.published ? 'published' : 'unpublished'}`)
      fetchEvents()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update event')
    }
  }

  const filteredEvents = events
    .filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesFilter =
        filter === 'all' ||
        (filter === 'published' && event.published !== false) ||
        (filter === 'draft' && event.published === false) ||
        (filter === 'popular' && event.popular)

      return matchesSearch && matchesFilter
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const bulk = useBulkSelection(filteredEvents, (e) => e.id)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleting(true)
    const ids = Array.from(bulk.selectedIds)
    const { succeededIds, failedIds } = await runBulkDelete(ids, (id) => eventService.deleteEvent(id))
    if (succeededIds.length > 0) {
      setEvents((prev) => prev.filter((e) => !succeededIds.includes(e.id)))
    }
    if (failedIds.length === 0) {
      toast.success(`${succeededIds.length} event${succeededIds.length === 1 ? '' : 's'} deleted`)
    } else if (succeededIds.length === 0) {
      toast.error(`Failed to delete ${failedIds.length} event${failedIds.length === 1 ? '' : 's'}`)
    } else {
      toast.success(`${succeededIds.length} deleted, ${failedIds.length} failed`)
    }
    bulk.clear()
    setBulkDeleting(false)
    setShowBulkDeleteModal(false)
  }

  const stats = {
    total: events.length,
    published: events.filter((e) => e.published !== false).length,
    fullyBooked: events.filter((e) => e.spotsRemaining <= 0).length,
    popular: events.filter((e) => e.popular).length,
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Events</h1>
            <p className="mt-1 text-gray-600">Manage fitness events and registrations</p>
          </div>
          <div className="w-40 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="admin-card h-24 bg-gray-100 animate-pulse"></div>
          ))}
        </div>
        <div className="bg-white rounded-xl shadow-adventure border border-gray-200 p-8">
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
              <button onClick={handleDeleteCancel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" disabled={deleting}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {eventToDelete && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-16 w-16 rounded-lg bg-cover bg-center flex-shrink-0"
                      style={{ backgroundImage: `url(${eventToDelete.image})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{eventToDelete.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">{eventService.formatDate(eventToDelete.date)}</p>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">Warning: This action cannot be undone</p>
                    <p className="text-sm text-red-700 mt-1">All registrations for this event will also be deleted.</p>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Events</h1>
          <p className="mt-1 text-gray-600">Manage fitness events and registrations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/admin/events/create" className="btn-primary flex items-center gap-2 w-fit">
            <Plus className="h-5 w-5" />
            New Event
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Events</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.published}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fully Booked</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.fullyBooked}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Users className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Popular</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.popular}</p>
            </div>
            <div className="p-3 bg-accent-50 rounded-lg">
              <Star className="h-6 w-6 text-accent-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events by title or location..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              disabled={refreshing}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            disabled={refreshing}
          >
            <option value="all">All Events</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
            <option value="popular">Popular</option>
          </select>
        </div>
      </div>

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        itemLabel="event"
        onClear={bulk.clear}
        onDeleteClick={() => setShowBulkDeleteModal(true)}
      />

      <BulkDeleteModal
        open={showBulkDeleteModal}
        count={bulk.selectedCount}
        itemLabel="event"
        warningText="All registrations for the selected events will also be deleted. This cannot be undone."
        deleting={bulkDeleting}
        onCancel={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDeleteConfirm}
      />

      <div className="bg-white rounded-xl shadow-adventure border border-gray-200 overflow-hidden">
        {refreshing ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Refreshing events...</p>
          </div>
        ) : filteredEvents.length === 0 && events.length > 0 ? (
          <EmptyState
            icon={Search}
            title="No events match your search"
            description="Try a different search term or filter."
            action={{
              label: 'Clear Filters',
              onClick: () => {
                setSearchQuery('')
                setFilter('all')
              },
            }}
          />
        ) : filteredEvents.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No events yet"
            description="Create your first event to start filling up the calendar."
            action={{ label: 'Create Event', icon: Plus, href: '/admin/events/create' }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={bulk.isAllSelected}
                      onChange={bulk.toggleAll}
                      className="h-4 w-4 text-accent-500 focus:ring-accent-500 rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[250px]">Event</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Spots</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEvents.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={bulk.isSelected(event.id)}
                        onChange={() => bulk.toggle(event.id)}
                        className="h-4 w-4 text-accent-500 focus:ring-accent-500 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="h-12 w-12 rounded-lg bg-cover bg-center flex-shrink-0 bg-gray-100"
                          style={{ backgroundImage: event.image ? `url(${event.image})` : undefined }}
                        />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{event.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <p className="text-sm text-gray-500 truncate max-w-xs">{event.location}</p>
                            {event.popular && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700 rounded flex-shrink-0">
                                <Star className="h-3 w-3" />
                                Popular
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {eventService.formatDate(event.date)}
                      <div className="text-xs text-gray-400">{event.time}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 whitespace-nowrap">
                      {event.price > 0 ? `${money(event.price)}` : 'Free'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {event.spotsRemaining}/{event.maxSpots}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleTogglePublished(event)}
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                          event.published !== false
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        }`}
                      >
                        {event.published !== false ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/events/${event.id}/registrations`}
                          className="p-2 hover:bg-blue-50 rounded-lg transition-colors text-blue-600"
                          title="Registrations"
                        >
                          <Users className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/admin/events/edit/${event.id}`}
                          className="p-2 hover:bg-accent-50 rounded-lg transition-colors text-accent-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(event)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title="Delete"
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredEvents.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Showing <span className="font-medium">{filteredEvents.length}</span> of{' '}
                <span className="font-medium">{events.length}</span> events
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
