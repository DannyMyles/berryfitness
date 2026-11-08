// app/admin/blog/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Eye, Upload, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { blogService, CreateBlogRequest } from '@/app/api_services/blogService'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

export default function CreateBlogPage() {
  useDocumentTitle('Create Blog Post')
  const router = useRouter()
  const [formData, setFormData] = useState<CreateBlogRequest>({
    title: '',
    excerpt: '',
    content: '',
    category: '',
    author: '',
    readTime: '5 min read',
    featured: false,
    tags: [],
    metaTitle: '',
    metaDescription: '',
    imageFile: null,
    imageUrl: ''
  })
  const [tagInput, setTagInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault()
      if (!formData.tags?.includes(tagInput.trim())) {
        setFormData({
          ...formData,
          tags: [...(formData.tags || []), tagInput.trim()]
        })
      }
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags || []).filter(tag => tag !== tagToRemove)
    })
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        toast.error('Please upload a valid image file (JPEG, PNG, GIF, WebP)')
        return
      }

      // Validate file size (16MB limit based on your API)
      if (file.size > 16 * 1024 * 1024) {
        toast.error('Image size must be less than 16MB')
        return
      }

      setFormData({
        ...formData,
        imageFile: file,
        imageUrl: '' // Clear URL if uploading file
      })

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleImageUrlChange = (url: string) => {
    setFormData({
      ...formData,
      imageUrl: url,
      imageFile: null // Clear file if using URL
    })
    setImagePreview(url)
  }

  const removeImage = () => {
    setFormData({
      ...formData,
      imageFile: null,
      imageUrl: ''
    })
    setImagePreview(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.title.trim() || !formData.content.trim() || !formData.category.trim()) {
      toast.error('Please fill in all required fields (Title, Content, and Category)')
      return
    }
    if (formData.excerpt.length > 300) {
      toast.error('Excerpt must be 300 characters or fewer')
      return
    }
    if ((formData.metaTitle?.length || 0) > 200) {
      toast.error('Meta title must be 200 characters or fewer')
      return
    }
    if ((formData.metaDescription?.length || 0) > 160) {
      toast.error('Meta description must be 160 characters or fewer')
      return
    }

    setLoading(true)

    try {
      // Prepare data for API
      const blogData: CreateBlogRequest = {
        ...formData,
        author: formData.author.trim() || 'Admin',
        excerpt: formData.excerpt.trim() || formData.title.slice(0, 150) + '...',
        metaTitle: formData.metaTitle?.trim() || formData.title.trim(),
        metaDescription: formData.metaDescription?.trim() || formData.excerpt.trim(),
        tags: (formData.tags || []).map(tag => tag.toLowerCase().trim()),
        readTime: blogService.estimateReadTime(formData.content)
      }

      await blogService.createBlog(blogData)
      toast.success('Blog created successfully!')
      router.push('/admin/blog')
    } catch (error: any) {
      console.error('Error creating blog:', error)
      toast.error(error.message || 'Failed to create blog. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: keyof CreateBlogRequest, value: any) => {
    setFormData({
      ...formData,
      [field]: value
    })
  }

  const categories = [
    'Workout Tips',
    'Nutrition',
    'Training Programs',
    'Success Stories',
    'Motivation',
    'Fitness Gear',
    'Health & Wellness',
    'Events & Announcements',
    'Recovery',
    'News'
  ]

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-accent-50 rounded-lg transition-colors"
            disabled={loading}
          >
            <ArrowLeft className="h-5 w-5 text-accent-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Blog Post</h1>
            <p className="mt-1 text-gray-600">Write and publish a new blog article</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-adventure flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Save className="h-5 w-5" />
            )}
            Publish Blog
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="adventure-card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Enter blog post title..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent text-lg font-medium"
              required
              disabled={loading}
            />
          </div>

          {/* Excerpt */}
          <div className="adventure-card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => handleChange('excerpt', e.target.value)}
              placeholder="A brief summary or introduction to your blog post..."
              rows={3}
              maxLength={300}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500">
              This will be shown in blog listings and search results (max 300 characters)
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {formData.excerpt.length}/300 characters
            </p>
          </div>

          {/* Content */}
          <div className="adventure-card">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Content *
              </label>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </div>
            </div>
            <textarea
              value={formData.content}
              onChange={(e) => handleChange('content', e.target.value)}
              placeholder="Write your blog post content here..."
              rows={15}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none font-mono"
              required
              disabled={loading}
            />
            <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
              <span>{formData.content.length} characters</span>
              <span>
                Read time: {blogService.estimateReadTime(formData.content)}
              </span>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Featured Image */}
          <div className="adventure-card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Featured Image
            </label>
            
            {/* Image Upload Area */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                    disabled={loading}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-sm text-gray-600 mb-3">Upload an image or enter URL</p>
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={loading}
                      />
                      <div className="bg-accent-50 text-accent-700 py-2 px-4 rounded-lg hover:bg-accent-100 transition-colors text-center">
                        Upload File
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => document.getElementById('imageUrlInput')?.focus()}
                      className="flex-1 border border-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Use URL
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Image URL Input */}
            <input
              id="imageUrlInput"
              type="url"
              value={formData.imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              disabled={loading || !!formData.imageFile}
            />
            <p className="mt-2 text-xs text-gray-500">
              Supports JPG, PNG, GIF, WebP (max 16MB) or external URL
            </p>
          </div>

          {/* Category */}
          <div className="adventure-card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              required
              disabled={loading}
            >
              <option value="">Select a category</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Author */}
          <div className="adventure-card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Author
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => handleChange('author', e.target.value)}
              placeholder="John Doe"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              disabled={loading}
            />
          </div>

          {/* Read Time */}
          <div className="adventure-card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Read Time
            </label>
            <div className="flex items-center gap-2">
              <select
                value={formData.readTime}
                onChange={(e) => handleChange('readTime', e.target.value)}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                disabled={loading}
              >
                <option value="1 min read">1 min read</option>
                <option value="3 min read">3 min read</option>
                <option value="5 min read">5 min read</option>
                <option value="7 min read">7 min read</option>
                <option value="10 min read">10 min read</option>
                <option value="15+ min read">15+ min read</option>
              </select>
              <button
                type="button"
                onClick={() => handleChange('readTime', blogService.estimateReadTime(formData.content))}
                className="px-3 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Auto
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="adventure-card">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {(formData.tags || []).map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-accent-50 text-accent-700 rounded-full text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-accent-900"
                    disabled={loading}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Type and press Enter to add tags..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              disabled={loading}
            />
            <p className="mt-2 text-sm text-gray-500">
              Use relevant tags like: weight loss, nutrition, HIIT, strength training, etc.
            </p>
          </div>

          {/* Featured Post */}
          <div className="adventure-card">
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => handleChange('featured', e.target.checked)}
                className="h-4 w-4 text-accent-500 focus:ring-accent-500"
                disabled={loading}
              />
              <span className="text-sm font-medium text-gray-700">
                Mark as Featured Post
              </span>
            </label>
            <p className="mt-2 text-sm text-gray-500">
              Featured posts are highlighted on the homepage
            </p>
          </div>

          {/* SEO Section */}
          <div className="adventure-card space-y-4">
            <h3 className="text-sm font-medium text-gray-700">SEO Settings</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                value={formData.metaTitle || ''}
                onChange={(e) => handleChange('metaTitle', e.target.value)}
                placeholder="SEO title for search engines"
                maxLength={200}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-400">
                {formData.metaTitle?.length || 0}/200 characters
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.metaDescription || ''}
                onChange={(e) => handleChange('metaDescription', e.target.value)}
                placeholder="SEO description for search engines"
                rows={3}
                maxLength={160}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-400">
                {formData.metaDescription?.length || 0}/160 characters
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}