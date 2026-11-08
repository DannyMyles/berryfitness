import { api } from "../lib/api"
import type { WhatsAppHandoff } from "@/types/commerce"

export interface EventItem {
  id: string
  title: string
  slug: string
  description: string
  date: string
  time: string
  location: string
  trainers: string[]
  image: string
  imageInfo?: {
    hasImage: boolean
    type?: 'uploaded' | 'external'
    contentType?: string
    size?: number
    url: string
  }
  price: number
  maxSpots: number
  spotsRemaining: number
  category?: string | null
  difficulty?: string | null
  duration?: string | null
  popular: boolean
  published: boolean
  createdAt: string
  updatedAt: string
}

export interface EventResponse {
  events: EventItem[]
}

// Bookings are confirmed with the customer on WhatsApp, then marked
// confirmed by an admin — there's no online payment step.
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled'

export interface EventRegistration {
  id: string
  ticketNumber: string
  attendeeName: string
  attendeePhone: string
  attendeeEmail?: string | null
  participants: number
  total: number
  notes?: string | null
  status: BookingStatus
  checkedInAt: string | null
  createdAt: string
}

export type CheckinOutcome = 'checked_in' | 'already_checked_in' | 'blocked_unconfirmed' | 'blocked_cancelled'

export interface CheckinResponse {
  registration: EventRegistration
  outcome: CheckinOutcome
}

export interface RegistrationResponse {
  registration: EventRegistration
  whatsapp: WhatsAppHandoff | null
}

export interface BookingInput {
  attendeeName: string
  attendeePhone: string
  attendeeEmail?: string
  participants: number
  notes?: string
  /** Same id on a retry = the server returns the original booking. */
  requestId?: string
}

export interface MyRegistration {
  id: number
  ticketNumber: string
  attendeeName: string
  attendeePhone: string
  participants: number
  total: number
  status: BookingStatus
  createdAt: string
  event: {
    id: number
    title: string
    slug: string
    date: string
    time: string
    location: string
    price: number
    image: string
  }
}

export interface CreateEventRequest {
  title: string
  description: string
  date: string
  time: string
  location: string
  trainers: string[]
  imageUrl?: string
  imageFile?: File | null
  price: number
  maxSpots: number
  popular?: boolean
  published?: boolean
}

export interface UpdateEventRequest extends Partial<CreateEventRequest> {}

export const eventService = {
  getAllEvents: async (params?: { upcoming?: boolean }): Promise<EventResponse> => {
    try {
      const response = await api.public.events.getAll(params)
      const eventsData = (response as any).events || response
      return { events: Array.isArray(eventsData) ? eventsData : [] }
    } catch (error) {
      console.error('Error fetching events:', error)
      throw error
    }
  },

  getEventBySlug: async (slug: string): Promise<EventItem> => {
    try {
      const response = await api.public.events.getBySlug(slug)
      return ((response as any).event || response) as EventItem
    } catch (error) {
      console.error(`Error fetching event ${slug}:`, error)
      throw error
    }
  },

  // Admin-only: fetches by numeric id regardless of published status (the
  // public getAllEvents/getEventBySlug only ever return published events,
  // so the edit form needs this to be able to load a draft event too).
  getEventById: async (id: string): Promise<EventItem> => {
    try {
      const response = await api.admin.events.getById(id)
      return ((response as any).event || response) as EventItem
    } catch (error) {
      console.error(`Error fetching event ${id}:`, error)
      throw error
    }
  },

  register: async (slug: string, data: BookingInput): Promise<RegistrationResponse> => {
    try {
      return await api.public.events.register(slug, data)
    } catch (error) {
      console.error(`Error registering for event ${slug}:`, error)
      throw error
    }
  },

  getMyRegistrations: async (): Promise<MyRegistration[]> => {
    try {
      const response = await api.protected.events.registrationsMine()
      const data = (response as any).registrations || response
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching my event registrations:', error)
      throw error
    }
  },


  createEvent: async (data: CreateEventRequest): Promise<EventItem> => {
    try {
      const formData = new FormData()
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('date', data.date)
      formData.append('time', data.time)
      formData.append('location', data.location)
      formData.append('trainers', JSON.stringify(data.trainers))
      formData.append('price', data.price.toString())
      formData.append('maxSpots', data.maxSpots.toString())
      if (data.popular !== undefined) formData.append('popular', data.popular.toString())
      if (data.published !== undefined) formData.append('published', data.published.toString())
      if (data.imageFile) {
        formData.append('image', data.imageFile)
      } else if (data.imageUrl) {
        formData.append('imageUrl', data.imageUrl)
      }

      const response = await api.admin.events.create(formData)
      return ((response as any).event || response) as EventItem
    } catch (error) {
      console.error('Error creating event:', error)
      throw error
    }
  },

  updateEvent: async (id: string, data: UpdateEventRequest): Promise<EventItem> => {
    try {
      const formData = new FormData()
      if (data.title) formData.append('title', data.title)
      if (data.description) formData.append('description', data.description)
      if (data.date) formData.append('date', data.date)
      if (data.time) formData.append('time', data.time)
      if (data.location) formData.append('location', data.location)
      if (data.trainers) formData.append('trainers', JSON.stringify(data.trainers))
      if (data.price !== undefined) formData.append('price', data.price.toString())
      if (data.maxSpots !== undefined) formData.append('maxSpots', data.maxSpots.toString())
      if (data.popular !== undefined) formData.append('popular', data.popular.toString())
      if (data.published !== undefined) formData.append('published', data.published.toString())
      if (data.imageFile) {
        formData.append('image', data.imageFile)
      } else if (data.imageUrl) {
        formData.append('imageUrl', data.imageUrl)
      }

      const response = await api.admin.events.update(id, formData)
      return ((response as any).event || response) as EventItem
    } catch (error) {
      console.error(`Error updating event ${id}:`, error)
      throw error
    }
  },

  deleteEvent: async (id: string): Promise<void> => {
    try {
      return await api.admin.events.delete(id)
    } catch (error) {
      console.error(`Error deleting event ${id}:`, error)
      throw error
    }
  },

  getRegistrations: async (id: string): Promise<{ registrations: EventRegistration[] }> => {
    try {
      const response = await api.admin.events.getRegistrations(id)
      const data = (response as any).registrations || response
      return { registrations: Array.isArray(data) ? data : [] }
    } catch (error) {
      console.error(`Error fetching registrations for event ${id}:`, error)
      throw error
    }
  },

  updateRegistrationStatus: async (id: string, status: BookingStatus): Promise<EventRegistration> => {
    try {
      const response = await api.admin.events.updateRegistrationStatus(id, status)
      return ((response as any).registration || response) as EventRegistration
    } catch (error) {
      console.error(`Error updating registration ${id}:`, error)
      throw error
    }
  },

  checkIn: async (eventId: string, ticketNumber: string): Promise<CheckinResponse> => {
    return api.admin.events.checkin(eventId, ticketNumber) as Promise<CheckinResponse>
  },

  formatDate: (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return dateString
    }
  },

  isUpcoming: (dateString: string): boolean => {
    // `date` only stores a calendar date (midnight) — compare against the
    // start of today, not the exact current instant, so a same-day event
    // doesn't look "already passed" once it's past midnight.
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    return new Date(dateString) >= startOfToday
  },

  statusDisplayName: (status: string): string => {
    switch (status) {
      case 'confirmed': return 'Confirmed'
      case 'cancelled': return 'Cancelled'
      default: return 'Awaiting confirmation'
    }
  },
}
