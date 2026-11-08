import { api } from "../lib/api"

export interface GalleryCategory {
  id: string
  name: string
  slug: string
  description?: string
  imageCount: number
  createdAt: string
  updatedAt: string
}

export interface GalleryImage {
  id: string
  title?: string
  categoryId: string
  url: string
  createdAt: string
}

export const galleryService = {
  getCategories: async (): Promise<GalleryCategory[]> => {
    const response = await api.public.gallery.getCategories()
    return ((response as any).categories || response) as GalleryCategory[]
  },

  getImages: async (categoryId?: string): Promise<GalleryImage[]> => {
    const response = await api.public.gallery.getImages(categoryId)
    // Oldest first, so the gallery opens with the General photos.
    return [...(((response as any).images || response) as GalleryImage[])].sort((a, b) => Number(a.id) - Number(b.id))
  },

  getImageUrl: (image: GalleryImage): string => {
    // Same-origin path — proxy.ts forwards it to the API with this app's key.
    return image.url
  },

  admin: {
    createCategory: async (data: { name: string; description?: string }): Promise<GalleryCategory> => {
      const response = await api.admin.gallery.createCategory(data)
      return ((response as any).category || response) as GalleryCategory
    },

    updateCategory: async (id: string, data: { name?: string; description?: string }): Promise<GalleryCategory> => {
      const response = await api.admin.gallery.updateCategory(id, data)
      return ((response as any).category || response) as GalleryCategory
    },

    deleteCategory: async (id: string): Promise<void> => {
      return await api.admin.gallery.deleteCategory(id)
    },

    uploadSingle: async (categoryId: string, file: File, title?: string): Promise<GalleryImage> => {
      const formData = new FormData()
      formData.append('categoryId', categoryId)
      formData.append('image', file)
      if (title) formData.append('title', title)

      const response = await api.admin.gallery.uploadSingle(formData)
      return ((response as any).image || response) as GalleryImage
    },

    uploadBulk: async (categoryId: string, files: File[]): Promise<GalleryImage[]> => {
      const formData = new FormData()
      formData.append('categoryId', categoryId)
      files.forEach((file) => formData.append('images', file))

      const response = await api.admin.gallery.uploadBulk(formData)
      // Oldest first, so the gallery opens with the General photos.
    return [...(((response as any).images || response) as GalleryImage[])].sort((a, b) => Number(a.id) - Number(b.id))
    },

    deleteImage: async (id: string): Promise<void> => {
      return await api.admin.gallery.deleteImage(id)
    },
  },
}
