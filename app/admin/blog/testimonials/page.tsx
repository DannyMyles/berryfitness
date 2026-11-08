'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  Plus, 
  Search, 
  Filter, 
  Star, 
  MessageSquare,
  User,
  Building,
  TrendingUp,
  Edit, 
  Trash2, 
  Eye,
  MoreVertical,
  Calendar,
  Award,
  CheckCircle,
  XCircle,
  ChevronUp,
  ChevronDown,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Testimonial, testimonialService } from '@/app/api_services/testimonialService'
import EmptyState from '@/components/ui/EmptyState'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

export default function TestimonialsManagementPage() {
  useDocumentTitle('Testimonials')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedTestimonials, setSelectedTestimonials] = useState<string[]>([])
  const [sortBy, setSortBy] = useState<'date' | 'rating' | 'name'>('date')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [testimonialToDelete, setTestimonialToDelete] = useState<Testimonial | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [companies, setCompanies] = useState<string[]>([])
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTestimonials()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowDeleteModal(false)
      }
    }

    if (showDeleteModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDeleteModal])

  const fetchTestimonials = async () => {
    try {
      setLoading(true)
      const response = await testimonialService.getAllTestimonials()
      setTestimonials(response.testimonials)
      
      // Extract unique companies
      const uniqueCompanies = testimonialService.getUniqueCompanies(response.testimonials)
      setCompanies(uniqueCompanies)
      
    } catch (error: any) {
      console.error('Error fetching testimonials:', error)
      toast.error(error.message || 'Failed to load testimonials')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteClick = (testimonial: Testimonial) => {
    setTestimonialToDelete(testimonial)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!testimonialToDelete) return
    
    setDeleting(true)
    try {
      await testimonialService.deleteTestimonial(testimonialToDelete.id)
      toast.success('Testimonial deleted successfully')
      fetchTestimonials() // Refresh the list
      setSelectedTestimonials(selectedTestimonials.filter(id => id !== testimonialToDelete.id))
    } catch (error: any) {
      console.error('Error deleting testimonial:', error)
      toast.error(error.message || 'Failed to delete testimonial')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      setTestimonialToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setTestimonialToDelete(null)
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTestimonials(filteredTestimonials.map(t => t.id))
    } else {
      setSelectedTestimonials([])
    }
  }

  const handleSelectTestimonial = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedTestimonials([...selectedTestimonials, id])
    } else {
      setSelectedTestimonials(selectedTestimonials.filter(testId => testId !== id))
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedTestimonials.length === 0) return
    if (!confirm(`Are you sure you want to delete ${selectedTestimonials.length} selected testimonials?`)) return
    
    try {
      await Promise.all(
        selectedTestimonials.map(id => testimonialService.deleteTestimonial(id))
      )
      toast.success(`${selectedTestimonials.length} testimonials deleted successfully`)
      fetchTestimonials()
      setSelectedTestimonials([])
    } catch (error: any) {
      console.error('Error deleting selected testimonials:', error)
      toast.error(error.message || 'Failed to delete selected testimonials')
    }
  }

  const handleToggleFeatured = async (testimonial: Testimonial) => {
    try {
      await testimonialService.updateTestimonial(testimonial.id, {
        ...testimonial,
        featured: !testimonial.featured,
      })
      toast.success(`Testimonial ${!testimonial.featured ? 'added to' : 'removed from'} featured`)
      fetchTestimonials() // Refresh the list
    } catch (error: any) {
      console.error('Error updating testimonial:', error)
      toast.error(error.message || 'Failed to update testimonial')
    }
  }

  const handleToggleStatus = async (testimonial: Testimonial) => {
    try {
      await testimonialService.toggleTestimonialStatus(testimonial.id, !testimonial.isActive)
      toast.success(`Testimonial ${!testimonial.isActive ? 'published' : 'archived'}`)
      fetchTestimonials() // Refresh the list
    } catch (error: any) {
      console.error('Error toggling testimonial status:', error)
      toast.error(error.message || 'Failed to update testimonial status')
    }
  }

  const filteredTestimonials = testimonials.filter(testimonial => {
    const matchesSearch = testimonial.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         testimonial.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         testimonial.content.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesStatus = filter === 'all' || 
                         (filter === 'published' && testimonial.isActive) ||
                         (filter === 'archived' && !testimonial.isActive) ||
                         (filter === 'featured' && testimonial.featured)
    
    const matchesRating = ratingFilter === 'all' || testimonial.rating === parseInt(ratingFilter)
    
    return matchesSearch && matchesStatus && matchesRating
  }).sort((a, b) => {
    let comparison = 0
    
    switch (sortBy) {
      case 'date':
        comparison = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        break
      case 'rating':
        comparison = b.rating - a.rating
        break
      case 'name':
        comparison = a.name.localeCompare(b.name)
        break
    }
    
    return sortOrder === 'asc' ? -comparison : comparison
  })

  const getStatusColor = (testimonial: Testimonial) => {
    const status = testimonialService.getTestimonialStatus(testimonial)
    switch (status) {
      case 'published': return 'bg-green-50 text-green-700'
      case 'pending': return 'bg-yellow-50 text-yellow-700'
      case 'draft': return 'bg-blue-50 text-blue-700'
      case 'archived': return 'bg-gray-50 text-gray-700'
      default: return 'bg-gray-50 text-gray-700'
    }
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    )
  }

  const stats = testimonialService.calculateStats(testimonials)

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
            <p className="mt-1 text-gray-600">Manage and showcase customer feedback</p>
          </div>
          <div className="w-40 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="adventure-card h-24 bg-gray-100 animate-pulse"></div>
          ))}
        </div>
        
        <div className="bg-white rounded-xl shadow-adventure border border-gray-200 p-8">
          <div className="flex justify-center items-center h-64">
            <div className="h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div 
            ref={modalRef}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
              <button
                onClick={handleDeleteCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={deleting}
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">Warning: This action cannot be undone</p>
                    <p className="text-sm text-red-700 mt-1">
                      This testimonial will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>

              {testimonialToDelete && (
                <div className="border border-gray-200 rounded-lg p-4">
                  <p className="font-medium text-gray-900 mb-2">Testimonial Details:</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-3">
                      {testimonialToDelete.photoInfo?.hasPhoto ? (
                        <img
                          src={testimonialService.getPhotoUrl(testimonialToDelete)}
                          alt={testimonialToDelete.name}
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="h-8 w-8 rounded-full flex items-center justify-center text-white font-semibold text-xs"
                          style={{ backgroundColor: testimonialToDelete.avatarColor }}
                        >
                          {testimonialService.getInitials(testimonialToDelete.name)}
                        </div>
                      )}
                      <div>
                        <div className="font-medium text-gray-900">{testimonialToDelete.name}</div>
                        <div className="text-gray-700">{testimonialToDelete.role}</div>
                      </div>
                    </div>
                    {testimonialToDelete.company && (
                      <div className="flex">
                        <span className="w-24 text-gray-500">Company:</span>
                        <span className="text-gray-700">{testimonialToDelete.company}</span>
                      </div>
                    )}
                    <div className="flex">
                      <span className="w-24 text-gray-500">Rating:</span>
                      <div className="flex">
                        {renderStars(testimonialToDelete.rating)}
                        <span className="text-gray-700 ml-2">{testimonialToDelete.rating}.0</span>
                      </div>
                    </div>
                    <div className="flex">
                      <span className="w-24 text-gray-500">Status:</span>
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(testimonialToDelete)}`}>
                        {testimonialService.getTestimonialStatus(testimonialToDelete)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Delete Permanently
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Testimonials</h1>
          <p className="mt-1 text-gray-600">Manage and showcase customer feedback</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Import
          </button>
          <Link
            href="/admin/blog/testimonials/create"
            className="btn-adventure flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Add Testimonial
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div className="adventure-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.total}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <MessageSquare className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="adventure-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Published</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.published}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="adventure-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Featured</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.featured}</p>
            </div>
            <div className="p-3 bg-accent-50 rounded-lg">
              <Award className="h-6 w-6 text-accent-600" />
            </div>
          </div>
        </div>
        
        <div className="adventure-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg. Rating</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.averageRating}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <Star className="h-6 w-6 text-yellow-600 fill-yellow-600" />
            </div>
          </div>
        </div>
        
        <div className="adventure-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">5-Star</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.topRating}</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
        
        <div className="adventure-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Archived</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.archived}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedTestimonials.length > 0 && (
        <div className="adventure-card bg-accent-50 border-accent-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-accent-100 rounded-lg flex items-center justify-center">
                <span className="text-accent-700 font-medium">{selectedTestimonials.length}</span>
              </div>
              <p className="text-accent-700 font-medium">
                {selectedTestimonials.length} testimonial{selectedTestimonials.length > 1 ? 's' : ''} selected
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm font-medium hover:bg-red-200 transition-colors"
              >
                Delete Selected
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search testimonials by name, company, or content..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
            <option value="featured">Featured</option>
          </select>
          
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          >
            <option value="all">All Ratings</option>
            <option value="5">★★★★★ (5)</option>
            <option value="4">★★★★☆ (4)</option>
            <option value="3">★★★☆☆ (3)</option>
            <option value="2">★★☆☆☆ (2)</option>
            <option value="1">★☆☆☆☆ (1)</option>
          </select>
          
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split('-')
              setSortBy(sort as any)
              setSortOrder(order as any)
            }}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="rating-desc">Highest Rated</option>
            <option value="rating-asc">Lowest Rated</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
          
          <button className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTestimonials.map((testimonial) => {
          const status = testimonialService.getTestimonialStatus(testimonial)
          
          return (
            <div key={testimonial.id} className="adventure-card group hover:shadow-adventure-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {testimonial.photoInfo?.hasPhoto ? (
                    <img
                      src={testimonialService.getPhotoUrl(testimonial)}
                      alt={testimonial.name}
                      className="h-12 w-12 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0"
                      style={{ backgroundColor: testimonial.avatarColor }}
                    >
                      {testimonial.image || testimonialService.getInitials(testimonial.name)}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">{testimonial.name}</h3>
                      {testimonial.featured && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-50 text-accent-700 rounded-full text-xs">
                          <Award className="h-3 w-3" />
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {testimonial.role}{testimonial.company && `, ${testimonial.company}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <input
                    type="checkbox"
                    checked={selectedTestimonials.includes(testimonial.id)}
                    onChange={(e) => handleSelectTestimonial(testimonial.id, e.target.checked)}
                    className="h-4 w-4 text-accent-500 focus:ring-accent-500"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleToggleFeatured(testimonial)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        testimonial.featured
                          ? 'bg-accent-50 text-accent-600 hover:bg-accent-100'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                      }`}
                      title={testimonial.featured ? 'Remove from featured' : 'Mark as featured'}
                    >
                      <Award className="h-4 w-4" />
                    </button>
                    
                    <Link
                      href={`/admin/blog/testimonials/edit/${testimonial.id}`}
                      className="p-1.5 hover:bg-accent-50 rounded-lg transition-colors text-accent-600"
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Link>
                    
                    <button
                      onClick={() => handleDeleteClick(testimonial)}
                      className="p-1.5 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="mb-4">
                <p className="text-gray-700 italic line-clamp-3">{testimonial.content}</p>
              </div>

              {/* Rating */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {renderStars(testimonial.rating)}
                    <span className="text-sm text-gray-600 ml-2">{testimonial.rating}.0</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(testimonial)}`}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </span>
                  
                  <button
                    onClick={() => handleToggleStatus(testimonial)}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${
                      testimonial.isActive
                        ? 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {testimonial.isActive ? 'Archive' : 'Publish'}
                  </button>
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {testimonialService.formatDate(testimonial.createdAt)}
                </div>
                
                <div className="flex items-center gap-2">
                  <Link
                    href={`/testimonials`}
                    className="text-xs text-accent-600 hover:text-accent-700 flex items-center gap-1"
                    target="_blank"
                  >
                    <Eye className="h-3 w-3" />
                    View Public
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Empty State */}
      {filteredTestimonials.length === 0 && (
        <div className="adventure-card">
          {testimonials.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="No testimonials yet"
              description="Add your first testimonial to start showcasing client results."
              action={{ label: 'Add Testimonial', icon: Plus, href: '/admin/blog/testimonials/create' }}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No testimonials match your filters"
              description="Try adjusting your search or filter criteria."
              action={{
                label: 'Clear All Filters',
                onClick: () => {
                  setSearchQuery('')
                  setFilter('all')
                  setRatingFilter('all')
                },
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}