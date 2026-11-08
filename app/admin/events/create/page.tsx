'use client'

import { money } from '@/app/lib/money'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Save,
  Calendar,
  Image as ImageIcon,
  Settings,
  Eye,
  AlertCircle,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { CreateEventRequest, eventService } from '@/app/api_services/eventService'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'
import TrainersInput from '@/components/ui/TrainersInput'

export default function CreateEventPage() {
  useDocumentTitle('Create Event')
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateEventRequest & { date: string }>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    trainers: ['Berry Fitness for Health'],
    imageUrl: '',
    imageFile: null,
    price: 0,
    maxSpots: 20,
    popular: false,
    published: true,
  })

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setFormData({ ...formData, imageFile: file, imageUrl: '' })
    const reader = new FileReader()
    reader.onload = (e) => setImagePreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleImageUrlChange = (url: string) => {
    setFormData({ ...formData, imageUrl: url, imageFile: null })
    setImagePreview(url || null)
  }

  const removeImage = () => {
    setFormData({ ...formData, imageFile: null, imageUrl: '' })
    setImagePreview(null)
  }

  const validateForm = () => {
    if (!formData.title.trim()) throw new Error('Title is required')
    if (!formData.description.trim()) throw new Error('Description is required')
    if (!formData.date) throw new Error('Date is required')
    if (!formData.time.trim()) throw new Error('Time is required')
    if (!formData.location.trim()) throw new Error('Location is required')
    if (formData.trainers.filter((t) => t.trim()).length === 0) throw new Error('At least one trainer is required')
    if (!formData.imageFile && !formData.imageUrl?.trim()) throw new Error('An image (upload or URL) is required')
    if (formData.price < 0) throw new Error('Price cannot be negative')
    if (formData.maxSpots < 1) throw new Error('Max spots must be at least 1')
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      validateForm()
      await eventService.createEvent({
        ...formData,
        trainers: formData.trainers.map((t) => t.trim()).filter(Boolean),
        date: new Date(formData.date).toISOString(),
      })
      toast.success('Event created successfully!')
      router.push('/admin/events')
    } catch (err: any) {
      console.error('Error creating event:', err)
      setError(err.message || 'Failed to create event')
      toast.error(err.message || 'Failed to create event')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-accent-50 rounded-lg transition-colors">
            <ArrowLeft className="h-5 w-5 text-accent-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create Event</h1>
            <p className="mt-1 text-gray-600">Add a new fitness event</p>
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
            Publish Event
          </button>
        </div>
      </div>

      {error && (
        <div className="adventure-card bg-red-50 border-red-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-blue-50 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </span>
              Event Details
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Morning HIIT Bootcamp"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Start your day with an intense high-intensity interval training session."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time *</label>
                  <input
                    type="text"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    placeholder="6:00 AM - 7:00 AM"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location *</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Nairobi Fitness Center"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    required
                  />
                </div>
                <TrainersInput
                  value={formData.trainers}
                  onChange={(trainers) => setFormData({ ...formData, trainers })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Price (USD, 0 = free)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Spots *</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.maxSpots}
                    onChange={(e) => setFormData({ ...formData, maxSpots: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <span className="p-2 bg-purple-50 rounded-lg">
                <ImageIcon className="h-5 w-5 text-purple-600" />
              </span>
              Event Image
            </h3>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 mb-4">
              {imagePreview ? (
                <div className="relative">
                  <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
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
                  <p className="text-sm text-gray-600 mb-3">Upload an image or enter a URL below</p>
                  <label className="inline-block cursor-pointer">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" disabled={loading} />
                    <div className="bg-accent-50 text-accent-700 py-2 px-4 rounded-lg hover:bg-accent-100 transition-colors text-center text-sm font-medium">
                      Upload File
                    </div>
                  </label>
                </div>
              )}
            </div>

            <input
              type="text"
              value={formData.imageUrl}
              onChange={(e) => handleImageUrlChange(e.target.value)}
              placeholder="/images/events/ngong-hills-hike.jpg or https://example.com/image.jpg"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              disabled={loading || !!formData.imageFile}
            />
            <p className="mt-2 text-xs text-gray-500">Upload a file (max 5MB) or paste an existing image path/URL</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-400" />
              Publication Settings
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) => setFormData({ ...formData, popular: e.target.checked })}
                    className="h-4 w-4 text-accent-500 focus:ring-accent-500"
                  />
                  <span className="ml-2 text-sm font-medium text-gray-700">Mark as Popular</span>
                </div>
                <Sparkles className={`h-4 w-4 ${formData.popular ? 'text-accent-600' : 'text-gray-300'}`} />
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  className="h-4 w-4 text-accent-500 focus:ring-accent-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">Published</span>
              </label>
              <p className="text-xs text-gray-500 -mt-2">Unpublished events are hidden from the public Events page</p>
            </div>
          </div>

          <div className="adventure-card">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Eye className="h-5 w-5 text-gray-400" />
              Preview
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{formData.title || 'Event Title'}</p>
              <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                {formData.description || 'Event description will appear here...'}
              </p>
              <p className="text-xs text-gray-500 mt-2">
                {formData.trainers.filter(Boolean).join(', ') || 'Trainer(s)'}
              </p>
              <p className="text-sm font-bold text-fitness-primary mt-3">
                {formData.price > 0 ? `${money(formData.price)}` : 'Free'}
              </p>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
