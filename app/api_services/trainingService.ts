import { api } from "../lib/api"

export type PricingType = 'fixed' | 'per_person' | 'quote'

export interface ServicePackage {
  id: number
  name: string
  description: string | null
  priceAmount: number | null
  pricingType: PricingType
  priceLabel: string | null
  minParticipants: number | null
  maxParticipants: number | null
  features: string[]
  popular: boolean
}

export interface Training {
  id: string
  title: string
  slug?: string
  description: string
  features: string[]
  price: string
  priceAmount: number | null
  pricingType: PricingType
  category: string | null
  audience: 'individual' | 'corporate' | 'both'
  duration: string | null
  groupSize: string | null
  schedule: string | null
  level: string | null
  location: string | null
  minParticipants: number | null
  maxParticipants: number | null
  bookingRequirements: string | null
  image: string
  icon?: string
  color?: string
  popular: boolean
  available: boolean
  order: number
  published: boolean
  packages: ServicePackage[]
  createdAt: string
  updatedAt: string
}

export interface TrainingResponse {
  trainings: Training[]
  pagination: {
    currentPage: number
    totalPages: number
    totalTrainings: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface CreateTrainingRequest {
  title: string
  description: string
  features: string[]
  price: string
  imageUrl?: string
  imageFile?: File | null
  icon?: string
  color?: string
  popular?: boolean
  order?: number
  published?: boolean
}

export interface UpdateTrainingRequest extends Partial<CreateTrainingRequest> {}

function toFormData(data: CreateTrainingRequest | UpdateTrainingRequest): FormData {
  const formData = new FormData()
  if (data.title !== undefined) formData.append('title', data.title)
  if (data.description !== undefined) formData.append('description', data.description)
  if (data.features !== undefined) formData.append('features', JSON.stringify(data.features))
  if (data.price !== undefined) formData.append('price', data.price)
  if (data.icon !== undefined) formData.append('icon', data.icon)
  if (data.color !== undefined) formData.append('color', data.color)
  if (data.popular !== undefined) formData.append('popular', data.popular.toString())
  if (data.order !== undefined) formData.append('order', data.order.toString())
  if (data.published !== undefined) formData.append('published', data.published.toString())
  if (data.imageFile) {
    formData.append('image', data.imageFile)
  } else if (data.imageUrl) {
    formData.append('imageUrl', data.imageUrl)
  }
  return formData
}

export const trainingService = {
  // Get all trainings (public - no auth required)
  getAllTrainings: async (): Promise<TrainingResponse> => {
    try {
      const response = await api.public.trainings.getAll()
      const trainingsData = (response as any).trainings || response

      if (Array.isArray(trainingsData)) {
        return {
          trainings: trainingsData,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalTrainings: trainingsData.length,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      }

      return response as TrainingResponse
    } catch (error) {
      console.error('Error fetching trainings:', error)
      throw error
    }
  },

  // Get single training (public - no auth required)
  getTrainingById: async (id: string): Promise<Training> => {
    try {
      const response = await api.public.trainings.getOne(id)
      return ((response as any).training || response) as Training
    } catch (error) {
      console.error(`Error fetching training ${id}:`, error)
      throw error
    }
  },

  // Create training (admin only)
  createTraining: async (data: CreateTrainingRequest): Promise<Training> => {
    try {
      const response = await api.admin.training.create(toFormData(data))
      return ((response as any).training || response) as Training
    } catch (error) {
      console.error('Error creating training:', error)
      throw error
    }
  },

  // Update training (admin only)
  updateTraining: async (id: string, data: UpdateTrainingRequest): Promise<Training> => {
    try {
      const response = await api.admin.training.update(id, toFormData(data))
      return ((response as any).training || response) as Training
    } catch (error) {
      console.error(`Error updating training ${id}:`, error)
      throw error
    }
  },

  // Delete training (admin only)
  deleteTraining: async (id: string): Promise<void> => {
    try {
      return await api.admin.training.delete(id)
    } catch (error) {
      console.error(`Error deleting training ${id}:`, error)
      throw error
    }
  },

  // Toggle published status (admin only)
  togglePublished: async (id: string, published: boolean): Promise<Training> => {
    try {
      const response = await api.admin.training.update(id, toFormData({ published }))
      return ((response as any).training || response) as Training
    } catch (error) {
      console.error(`Error toggling training status ${id}:`, error)
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

  // Sort trainings for public display: published first, then by order
  sortForDisplay: (trainings: Training[]): Training[] => {
    return [...trainings]
      .filter(t => t.published !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }
}
