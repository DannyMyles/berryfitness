// blogService.ts - Complete implementation

import { api } from "../lib/api"

// getBlogBySlug is called both client-side and server-side (Next.js
// generateMetadata on the public post page) — the shared ApiClient's
// relative-path requests only resolve in a browser, so this one call goes
// through a direct absolute-URL fetch instead, same fix productService.ts
// already applies to getProduct() for the identical reason.
import { backendFetch } from '../lib/backend'

export interface Blog {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  category: string
  author: string
  authorId?: string
  authorDetails?: {
    name?: string
    email?: string
  }
  date: string
  readTime: string
  image: string
  imageInfo: {
    hasImage: boolean
    type?: 'uploaded' | 'external'
    contentType?: string
    filename?: string
    size?: number
    url: string
  }
  featured: boolean
  views: number
  likes: number
  tags: string[]
  metaTitle?: string
  metaDescription?: string
  createdAt: string
  updatedAt: string
  published: boolean
}

export interface BlogResponse {
  blogs: Blog[]
  pagination: {
    currentPage: number
    totalPages: number
    totalBlogs: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export interface Category {
  name: string
  count: number
}

export interface BlogStats {
  totalBlogs: number
  blogsWithImages: number
  totalImageSize: number
  avgImageSize: number
  maxImageSize: number
}

export interface CreateBlogRequest {
  title: string
  excerpt: string
  content: string
  category: string
  author: string
  readTime?: string
  featured?: boolean
  tags?: string[]
  metaTitle?: string
  metaDescription?: string
  imageFile?: File | null
  imageUrl?: string
  published?: boolean 
}

export interface UpdateBlogRequest extends Partial<CreateBlogRequest> {}

export const blogService = {
  // Get all blogs with pagination and filters
  getAllBlogs: async (params?: {
    page?: number
    limit?: number
    category?: string
    featured?: boolean
    search?: string
    sort?: string
  }): Promise<BlogResponse> => {
    try {
      const query = new URLSearchParams()
      if (params) {
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined && value !== null) query.append(key, String(value))
        })
      }
      const qs = query.toString()
      const res = await backendFetch(`/api/v1/blogs${qs ? `?${qs}` : ''}`, { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Request failed with status ${res.status}`)
      }
      const response = await res.json()

      // Handle both wrapped ({ blogs: [...] }) and direct responses
      const blogsData = (response as any).blogs || response
      
      // If blogs is an array, construct the proper response
      if (Array.isArray(blogsData)) {
        return {
          blogs: blogsData,
          pagination: {
            currentPage: 1,
            totalPages: 1,
            totalBlogs: blogsData.length,
            hasNextPage: false,
            hasPrevPage: false
          }
        }
      }
      
      return response as BlogResponse
    } catch (error) {
      console.error('Error fetching blogs:', error)
      throw error
    }
  },

  // Get blog by slug
  getBlogBySlug: async (slug: string): Promise<Blog> => {
    try {
      const res = await backendFetch(`/api/v1/blogs/slug/${encodeURIComponent(slug)}`, { cache: 'no-store' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || `Request failed with status ${res.status}`)
      }
      const data = await res.json()
      return data.blog
    } catch (error) {
      console.error(`Error fetching blog by slug ${slug}:`, error)
      throw error
    }
  },

  // Get blog by ID
  getBlogById: async (id: string): Promise<Blog> => {
    try {
      const response = await api.public.blog.getById(id)
      return response.blog
    } catch (error) {
      console.error(`Error fetching blog ${id}:`, error)
      throw error
    }
  },

  // Get featured blogs
  getFeaturedBlogs: async (): Promise<Blog[]> => {
    try {
      const response = await api.public.blog.getFeatured()
      return response.blogs
    } catch (error) {
      console.error('Error fetching featured blogs:', error)
      throw error
    }
  },

  // Get blog categories
  getBlogCategories: async (): Promise<Category[]> => {
    try {
      const response = await api.public.blog.getCategories()
      return response.categories
    } catch (error) {
      console.error('Error fetching blog categories:', error)
      throw error
    }
  },

  // Get blog statistics
  getBlogStats: async (): Promise<BlogStats> => {
    try {
      const response = await api.public.blog.getStats()
      return response.stats
    } catch (error) {
      console.error('Error fetching blog stats:', error)
      throw error
    }
  },

  // Like a blog
  likeBlog: async (id: string): Promise<{ likes: number }> => {
    try {
      const response = await api.public.blog.like(id)
      return response
    } catch (error) {
      console.error(`Error liking blog ${id}:`, error)
      throw error
    }
  },

  // Get blog image URL
  // Update in blogService.ts
getBlogImageUrl: (blog: Blog): string => {
  if (blog.imageInfo?.url) {
    // Check if it's already a full URL
    if (blog.imageInfo.url.startsWith('http')) {
      return blog.imageInfo.url;
    }
    
    // Same-origin path — proxy.ts forwards it to the API with this app's key.
    return `/api/v1/blogs/${blog.id}/image`;
  }
  
  // Fallback image
  return 'https://cdn.dribbble.com/userupload/41784969/file/still-f9b1bc8254d3e952592927149caef80f.gif?resize=400x0';
},

  // Create blog (admin only)
  createBlog: async (data: CreateBlogRequest): Promise<Blog> => {
    try {
      const formData = new FormData()
      
      // Add text fields
      formData.append('title', data.title)
      formData.append('excerpt', data.excerpt)
      formData.append('content', data.content)
      formData.append('category', data.category)
      formData.append('author', data.author)
      
      if (data.readTime) formData.append('readTime', data.readTime)
      if (data.featured !== undefined) formData.append('featured', data.featured.toString())
      if (data.tags) formData.append('tags', JSON.stringify(data.tags))
      if (data.metaTitle) formData.append('metaTitle', data.metaTitle)
      if (data.metaDescription) formData.append('metaDescription', data.metaDescription)
      if (data.imageUrl) formData.append('imageUrl', data.imageUrl)
      
      // Add image file if present
      if (data.imageFile) {
        formData.append('image', data.imageFile)
      }
      
      return await api.admin.blog.create(formData)
    } catch (error) {
      console.error('Error creating blog:', error)
      throw error
    }
  },

  // Update blog (admin only)
  updateBlog: async (id: string, data: UpdateBlogRequest): Promise<Blog> => {
    try {
      const formData = new FormData()
      
      // Add text fields
      if (data.title) formData.append('title', data.title)
      if (data.excerpt) formData.append('excerpt', data.excerpt)
      if (data.content) formData.append('content', data.content)
      if (data.category) formData.append('category', data.category)
      if (data.author) formData.append('author', data.author)
      if (data.readTime) formData.append('readTime', data.readTime)
      if (data.featured !== undefined) formData.append('featured', data.featured.toString())
      if (data.tags) formData.append('tags', JSON.stringify(data.tags))
      if (data.metaTitle) formData.append('metaTitle', data.metaTitle)
      if (data.metaDescription) formData.append('metaDescription', data.metaDescription)
      if (data.imageUrl) formData.append('imageUrl', data.imageUrl)
      
      // Add image file if present
      if (data.imageFile) {
        formData.append('image', data.imageFile)
      }
      
      return await api.admin.blog.update(id, formData)
    } catch (error) {
      console.error(`Error updating blog ${id}:`, error)
      throw error
    }
  },

  // Delete blog (admin only)
  deleteBlog: async (id: string): Promise<void> => {
    try {
      return await api.admin.blog.delete(id)
    } catch (error) {
      console.error(`Error deleting blog ${id}:`, error)
      throw error
    }
  },

  // Helper function to format date
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

  // Get reading time estimate from content
  estimateReadTime: (content: string): string => {
    const wordsPerMinute = 200
    const words = content.split(/\s+/).length
    const minutes = Math.ceil(words / wordsPerMinute)
    return `${minutes} min read`
  }
}