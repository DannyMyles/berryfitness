import { api } from '../lib/api'

export interface YoutubeVideo {
  id: string
  title: string
  description: string
  publishedAt: string
  thumbnail: string
}

export const youtubeService = {
  getVideos: async (): Promise<YoutubeVideo[]> => {
    try {
      const response = await api.public.youtube.getVideos()
      const data = (response as any).videos || response
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('Error fetching YouTube videos:', error)
      throw error
    }
  },

  getVideoUrl: (id: string): string => `https://www.youtube.com/watch?v=${id}`,

  getEmbedUrl: (id: string): string => `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`,

  formatDate: (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    } catch {
      return dateString
    }
  },
}
