import { api } from '../lib/api'

export interface NewsletterSubscriber {
  id: string
  email: string
  createdAt: string
}

export const newsletterService = {
  subscribe: async (email: string): Promise<void> => {
    await api.public.newsletter.subscribe(email)
  },

  unsubscribe: async (email: string, token: string): Promise<void> => {
    await api.public.newsletter.unsubscribe(email, token)
  },

  admin: {
    getAll: async (): Promise<NewsletterSubscriber[]> => {
      const response = await api.admin.newsletter.getAll()
      const data = (response as any).subscribers || response
      return Array.isArray(data) ? data : []
    },

    delete: async (id: string): Promise<void> => {
      await api.admin.newsletter.delete(id)
    },

    sendCampaign: async (data: { subject: string; message: string }): Promise<{ message: string; recipientCount: number }> => {
      return api.admin.newsletter.send(data) as Promise<{ message: string; recipientCount: number }>
    },
  },

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
