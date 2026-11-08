import { api } from "../lib/api"

export interface Testimonial {
  id: string
  name: string
  role: string
  company: string
  content: string
  rating: number
  image: string
  avatarColor: string
  achievement?: string
  photoUrl?: string
  photoInfo?: {
    hasPhoto: boolean
    contentType?: string
    size?: number
    url: string
  }
  featured: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface TestimonialResponse {
  testimonials: Testimonial[]
  pagination: {
    currentPage: number
    totalPages: number
    totalTestimonials: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface CreateTestimonialRequest {
  name: string
  role: string
  company?: string
  content: string
  rating: number
  image?: string
  avatarColor: string
  achievement?: string
  featured: boolean
  photoFile?: File | null
}

export interface SubmitTestimonialRequest {
  name: string
  role: string
  company?: string
  content: string
  rating: number
  photoFile?: File | null
}

export const testimonialService = {
  // Get all testimonials (public - no auth required)
  getAllTestimonials: async (): Promise<TestimonialResponse> => {
    try {
      const response = await api.public.testimonials.getAll()
      console.log('Get all testimonials response:', response)
      
      // Handle both wrapped ({ testimonials: [...] }) and direct responses
      const testimonialsData = (response as any).testimonials || response
      
      // If testimonials is an array, construct the proper response
      if (Array.isArray(testimonialsData)) {
        return {
          testimonials: testimonialsData,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalTestimonials: testimonialsData.length,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      }
      
      return response as TestimonialResponse
    } catch (error) {
      console.error('Error fetching testimonials:', error)
      throw error
    }
  },

  // Get single testimonial (public - no auth required)
  getTestimonialById: async (id: string): Promise<Testimonial> => {
    try {
      const response = await api.public.testimonials.getOne(id)
      console.log('Get testimonial by ID response:', response)
      
      // Handle both wrapped ({ testimonial: ... }) and direct responses
      const testimonialData = (response as any).testimonial || response
      return testimonialData as Testimonial
    } catch (error) {
      console.error(`Error fetching testimonial ${id}:`, error)
      throw error
    }
  },

  // Publicly submit a testimonial (no auth) — goes live only once an admin
  // approves it via toggleTestimonialStatus.
  submitTestimonial: async (data: SubmitTestimonialRequest): Promise<{ message: string }> => {
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('role', data.role)
      formData.append('content', data.content)
      formData.append('rating', data.rating.toString())
      if (data.company) formData.append('company', data.company)
      if (data.photoFile) formData.append('photo', data.photoFile)

      const response = await api.public.testimonials.submit(formData)
      return response as { message: string }
    } catch (error) {
      console.error('Error submitting testimonial:', error)
      throw error
    }
  },

  // Create testimonial (admin only)
  createTestimonial: async (data: CreateTestimonialRequest): Promise<Testimonial> => {
    try {
      const formData = new FormData()
      formData.append('name', data.name)
      formData.append('role', data.role)
      formData.append('content', data.content)
      formData.append('rating', data.rating.toString())
      formData.append('avatarColor', data.avatarColor)
      formData.append('featured', data.featured.toString())

      if (data.company) formData.append('company', data.company)
      if (data.image) formData.append('image', data.image)
      if (data.achievement) formData.append('achievement', data.achievement)
      if (data.photoFile) formData.append('photo', data.photoFile)

      const response = await api.admin.testimonial.create(formData)
      return ((response as any).testimonial || response) as Testimonial
    } catch (error) {
      console.error('Error creating testimonial:', error)
      throw error
    }
  },

  // Update testimonial (admin only)
  updateTestimonial: async (id: string, data: Partial<CreateTestimonialRequest>): Promise<Testimonial> => {
    try {
      const formData = new FormData()
      if (data.name) formData.append('name', data.name)
      if (data.role) formData.append('role', data.role)
      if (data.content) formData.append('content', data.content)
      if (data.rating !== undefined) formData.append('rating', data.rating.toString())
      if (data.avatarColor) formData.append('avatarColor', data.avatarColor)
      if (data.featured !== undefined) formData.append('featured', data.featured.toString())
      if (data.company !== undefined) formData.append('company', data.company)
      if (data.image !== undefined) formData.append('image', data.image)
      if (data.achievement !== undefined) formData.append('achievement', data.achievement)
      if (data.photoFile) formData.append('photo', data.photoFile)

      const response = await api.admin.testimonial.update(id, formData)
      return ((response as any).testimonial || response) as Testimonial
    } catch (error) {
      console.error(`Error updating testimonial ${id}:`, error)
      throw error
    }
  },

  // Delete testimonial (admin only)
  deleteTestimonial: async (id: string): Promise<void> => {
    try {
      return await api.admin.testimonial.delete(id)
    } catch (error) {
      console.error(`Error deleting testimonial ${id}:`, error)
      throw error
    }
  },

  // Toggle testimonial active status (admin only)
  toggleTestimonialStatus: async (id: string, isActive: boolean): Promise<Testimonial> => {
    try {
      return await api.admin.testimonial.updateStatus(id, { isActive })
    } catch (error) {
      console.error(`Error toggling testimonial status ${id}:`, error)
      throw error
    }
  },

  // Format date for display
  formatDate: (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  },

  // Get testimonial status
  getTestimonialStatus: (testimonial: Testimonial): 'published' | 'pending' | 'draft' | 'archived' => {
    return testimonial.isActive ? 'published' : 'archived'
  },

  // Calculate statistics
  calculateStats: (testimonials: Testimonial[]) => {
    const total = testimonials.length
    const published = testimonials.filter(t => t.isActive).length
    const featured = testimonials.filter(t => t.featured).length
    const archived = testimonials.filter(t => !t.isActive).length
    const averageRating = testimonials.length > 0 
      ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
      : '0.0'
    const topRating = testimonials.filter(t => t.rating === 5).length

    return {
      total,
      published,
      featured,
      archived,
      averageRating,
      topRating
    }
  },

  // Get unique companies
  getUniqueCompanies: (testimonials: Testimonial[]): string[] => {
    const companies = testimonials
      .map(t => t.company)
      .filter((company): company is string => !!company)
    return Array.from(new Set(companies)).sort()
  },

  // Generate initials from name
  getInitials: (name: string): string => {
    if (!name.trim()) return 'JD'
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  },

  // Render stars
  renderStars: (rating: number): string => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating)
  },

  // Featured + active testimonials for public display (e.g. homepage carousel)
  getFeaturedForDisplay: (testimonials: Testimonial[]): Testimonial[] => {
    return testimonials.filter((t) => t.featured && t.isActive)
  },

  // Get the uploaded photo URL for a testimonial, or '' if none was uploaded
  getPhotoUrl: (testimonial: Testimonial): string => {
    if (!testimonial.photoInfo?.hasPhoto) return ''

    // Same-origin path — proxy.ts forwards it to the API with this app's key.
    return `/api/v1/testimonials/${testimonial.id}/photo`
  }
}

