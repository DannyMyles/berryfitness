'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Star,
  User,
  Building,
  MessageSquare,
  Palette,
  Eye,
  AlertCircle,
  Sparkles,
  Loader2,
  Upload,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { CreateTestimonialRequest, testimonialService, Testimonial } from '@/app/api_services/testimonialService'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

export default function EditTestimonialPage() {
  useDocumentTitle('Edit Testimonial')
  const router = useRouter()
  const params = useParams()
  const testimonialId = params.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState<CreateTestimonialRequest>({
    name: '',
    role: '',
    company: '',
    content: '',
    rating: 5,
    avatarColor: '#3b82f6',
    featured: true,
    photoFile: null,
  })

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a valid image file')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB')
      return
    }

    setFormData({ ...formData, photoFile: file })
    const reader = new FileReader()
    reader.onload = (e) => setPhotoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const removePhoto = () => {
    setFormData({ ...formData, photoFile: null })
    setPhotoPreview(null)
  }

  const avatarColors = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#8b5cf6', // Violet
    '#f59e0b', // Amber
    '#ef4444', // Red
    '#ec4899', // Pink
    '#14b8a6', // Teal
    '#6366f1', // Indigo
    '#84cc16', // Lime
    '#f97316', // Orange,
  ]

  // Fetch testimonial data on mount
  useEffect(() => {
    fetchTestimonial()
  }, [testimonialId])

  const fetchTestimonial = async () => {
    try {
      setLoading(true)
      const testimonial = await testimonialService.getTestimonialById(testimonialId)
      
      setFormData({
        name: testimonial.name,
        role: testimonial.role,
        company: testimonial.company || '',
        content: testimonial.content,
        rating: testimonial.rating,
        avatarColor: testimonial.avatarColor || '#3b82f6',
        achievement: testimonial.achievement || '',
        featured: testimonial.featured,
        photoFile: null,
      })

      if (testimonial.photoInfo?.hasPhoto) {
        setPhotoPreview(testimonialService.getPhotoUrl(testimonial))
      }
    } catch (err: any) {
      console.error('Error fetching testimonial:', err)
      setError(err.message || 'Failed to load testimonial')
      toast.error('Failed to load testimonial')
    } finally {
      setLoading(false)
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setFormData({...formData, rating: i + 1})}
            className="p-1 hover:scale-110 transition-transform"
          >
            <Star
              className={`h-8 w-8 ${
                i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  const validateForm = () => {
    if (!formData.name.trim()) {
      throw new Error('Name is required')
    }
    if (!formData.role.trim()) {
      throw new Error('Role is required')
    }
    if (!formData.content.trim()) {
      throw new Error('Testimonial content is required')
    }
    if (formData.content.length < 20) {
      throw new Error('Testimonial content should be at least 20 characters')
    }
    if (formData.content.length > 500) {
      throw new Error('Testimonial content should not exceed 500 characters')
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      validateForm()

      // Prepare data for API
      const testimonialData = {
        ...formData,
        // Generate image initials if not provided
        image: testimonialService.getInitials(formData.name),
      }

      await testimonialService.updateTestimonial(testimonialId, testimonialData)
      toast.success('Testimonial updated successfully!')
      router.push('/admin/blog/testimonials')
      
    } catch (err: any) {
      console.error('Error updating testimonial:', err)
      setError(err.message || 'Failed to update testimonial')
      toast.error(err.message || 'Failed to update testimonial')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 bg-gray-200 animate-pulse rounded-lg"></div>
            <div>
              <div className="h-8 w-48 bg-gray-200 animate-pulse rounded"></div>
              <div className="h-4 w-64 bg-gray-200 animate-pulse rounded mt-2"></div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-adventure border border-gray-200 p-8">
          <div className="flex justify-center items-center h-64">
            <div className="flex items-center gap-3">
              <Loader2 className="h-6 w-6 animate-spin text-accent-500" />
              <span className="text-gray-600">Loading testimonial details...</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-accent-50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-accent-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Edit Testimonial</h1>
            <p className="mt-1 text-gray-600">Update customer testimonial</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn-adventure flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="adventure-card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-blue-50 rounded-lg">
                <User className="h-5 w-5 text-blue-600" />
              </span>
              Customer Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Karish"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role/Position *
                </label>
                <input
                  type="text"
                  value={formData.role}
                  onChange={(e) => setFormData({...formData, role: e.target.value})}
                  placeholder="HR Director"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Company/Organization
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.company || ''}
                    onChange={(e) => setFormData({...formData, company: e.target.value})}
                    placeholder="Precision Manufacturing Ltd"
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Testimonial Content */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-accent-50 rounded-lg">
                <MessageSquare className="h-5 w-5 text-accent-600" />
              </span>
              Testimonial Content
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating *
                </label>
                <div className="flex items-center gap-4">
                  {renderStars(formData.rating)}
                  <span className="text-lg font-semibold text-gray-900">
                    {formData.rating}.0
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Testimonial Text *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  placeholder="Share your experience..."
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                  required
                />
                <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                  <span>{formData.content.length} / 500 characters</span>
                  <span className={`${
                    formData.content.length < 20 || formData.content.length > 500 
                      ? 'text-red-500' 
                      : 'text-green-500'
                  }`}>
                    {formData.content.length < 20 ? 'Minimum 20 characters' :
                     formData.content.length > 500 ? 'Maximum 500 characters' :
                     'Good length'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Achievement Badge (optional)
                </label>
                <input
                  type="text"
                  value={formData.achievement ?? ''}
                  onChange={(e) => setFormData({...formData, achievement: e.target.value})}
                  placeholder="e.g. -30kg Lost, +15kg Muscle"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">Shown as a highlight badge next to the testimonial, if provided</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Avatar Preview */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Photo / Avatar</h3>

            <div className="space-y-4">
              <div className="flex items-center justify-center">
                {photoPreview ? (
                  <div className="relative">
                    <img
                      src={photoPreview}
                      alt="Preview"
                      className="h-24 w-24 rounded-full object-cover shadow-lg"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -top-1 -right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      disabled={saving}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div
                    className="h-24 w-24 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                    style={{ backgroundColor: formData.avatarColor }}
                  >
                    {testimonialService.getInitials(formData.name || 'JD')}
                  </div>
                )}
              </div>

              <div>
                <label className="flex-1 cursor-pointer block">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    disabled={saving}
                  />
                  <div className="flex items-center justify-center gap-2 bg-accent-50 text-accent-700 py-2 px-4 rounded-lg hover:bg-accent-100 transition-colors text-sm font-medium">
                    <Upload className="h-4 w-4" />
                    {photoPreview ? 'Replace Photo' : 'Upload Photo'}
                  </div>
                </label>
                <p className="text-xs text-gray-500 mt-2">Optional — max 5MB. Without a photo, a colored initials avatar is used instead.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avatar Color {photoPreview && <span className="text-gray-400 font-normal">(used if photo is removed)</span>}
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {avatarColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({...formData, avatarColor: color})}
                      className={`h-10 w-10 rounded-full border-2 ${
                        formData.avatarColor === color 
                          ? 'border-accent-500 ring-2 ring-accent-200' 
                          : 'border-gray-300 hover:border-accent-400'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-gray-400" />
                  <input
                    type="color"
                    value={formData.avatarColor}
                    onChange={(e) => setFormData({...formData, avatarColor: e.target.value})}
                    className="h-8 w-8 cursor-pointer"
                  />
                  <span className="text-sm text-gray-600">{formData.avatarColor}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Publication Settings */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Publication Settings</h3>
            
            <div className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) => setFormData({...formData, featured: e.target.checked})}
                      className="h-4 w-4 text-accent-500 focus:ring-accent-500"
                    />
                    <span className="ml-2 text-sm font-medium text-gray-700">Featured Testimonial</span>
                  </div>
                  <Sparkles className={`h-4 w-4 ${formData.featured ? 'text-accent-600' : 'text-gray-300'}`} />
                </label>
                <p className="text-xs text-gray-500">Featured testimonials appear prominently on the homepage</p>
              </div>
            </div>
          </div>

          {/* Testimonial Preview */}
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-400" />
              Preview
            </h3>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  {photoPreview ? (
                    <img src={photoPreview} alt="" className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold"
                      style={{ backgroundColor: formData.avatarColor }}
                    >
                      {testimonialService.getInitials(formData.name || 'JD')}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {formData.name || 'John Doe'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.role || 'Position'}{formData.company && `, ${formData.company}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${
                        i < formData.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                
                <p className="text-gray-700 italic text-sm">
                  {formData.content || '"Your testimonial content will appear here..."'}
                </p>
                
                {formData.featured && (
                  <div className="mt-3">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent-50 text-accent-700 rounded-full text-xs">
                      <Sparkles className="h-3 w-3" />
                      Featured Testimonial
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

