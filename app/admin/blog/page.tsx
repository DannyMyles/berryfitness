// app/admin/blog/page.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter, MoreVertical, Edit, Trash2, Eye, Calendar, X, RefreshCw, FileText } from 'lucide-react'
import toast from 'react-hot-toast'
import { Blog, blogService } from '@/app/api_services/blogService'
import EmptyState from '@/components/ui/EmptyState'
import BulkActionBar from '@/components/ui/BulkActionBar'
import BulkDeleteModal from '@/components/ui/BulkDeleteModal'
import { useBulkSelection } from '@/app/lib/useBulkSelection'
import { runBulkDelete } from '@/app/lib/bulkDelete'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

interface BlogStats {
  totalBlogs: number
  blogsWithImages: number
  totalImageSize: number
  avgImageSize: number
  maxImageSize: number
}

export default function BlogManagementPage() {
  useDocumentTitle('Blog')
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [blogs, setBlogs] = useState<Blog[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState<BlogStats>({
    totalBlogs: 0,
    blogsWithImages: 0,
    totalImageSize: 0,
    avgImageSize: 0,
    maxImageSize: 0
  })
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [blogToDelete, setBlogToDelete] = useState<Blog | null>(null)
  const [deleting, setDeleting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchBlogs()
    fetchStats()
  }, [])

  // Close modal when clicking outside
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

  const fetchBlogs = async () => {
    try {
      setLoading(true)
      const response = await blogService.getAllBlogs({
        limit: 50, // Show more blogs in admin
        sort: '-createdAt'
      })
      setBlogs(response.blogs)
    } catch (error: any) {
      console.error('Error fetching blogs:', error)
      toast.error(error.message || 'Failed to load blogs')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchStats = async () => {
    try {
      const statsData = await blogService.getBlogStats()
      setStats(statsData)
    } catch (error: any) {
      console.error('Error fetching stats:', error)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchBlogs()
    fetchStats()
  }

  const handleDeleteClick = (blog: Blog) => {
    setBlogToDelete(blog)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!blogToDelete) return
    
    setDeleting(true)
    try {
      await blogService.deleteBlog(blogToDelete.id)
      toast.success('Blog deleted successfully')
      // Update local state immediately
      setBlogs(prev => prev.filter(blog => blog.id !== blogToDelete.id))
      // Refresh stats
      fetchStats()
    } catch (error: any) {
      console.error('Error deleting blog:', error)
      toast.error(error.message || 'Failed to delete blog')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      setBlogToDelete(null)
    }
  }

  const handleDeleteCancel = () => {
    setShowDeleteModal(false)
    setBlogToDelete(null)
  }

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         blog.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())) ||
                         blog.author.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
                         (filter === 'featured' && blog.featured) ||
                         (filter === 'published' && blog.published !== false) ||
                         (filter === 'draft' && blog.published === false)
    
    return matchesSearch && matchesFilter
  })

  const bulk = useBulkSelection(filteredBlogs, (b) => b.id)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleting(true)
    const ids = Array.from(bulk.selectedIds)
    const { succeededIds, failedIds } = await runBulkDelete(ids, (id) => blogService.deleteBlog(id))
    if (succeededIds.length > 0) {
      setBlogs((prev) => prev.filter((b) => !succeededIds.includes(b.id)))
      fetchStats()
    }
    if (failedIds.length === 0) {
      toast.success(`${succeededIds.length} post${succeededIds.length === 1 ? '' : 's'} deleted`)
    } else if (succeededIds.length === 0) {
      toast.error(`Failed to delete ${failedIds.length} post${failedIds.length === 1 ? '' : 's'}`)
    } else {
      toast.success(`${succeededIds.length} deleted, ${failedIds.length} failed`)
    }
    bulk.clear()
    setBulkDeleting(false)
    setShowBulkDeleteModal(false)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
            <p className="mt-1 text-gray-600">Create and manage blog posts</p>
          </div>
          <div className="w-40 h-10 bg-gray-200 animate-pulse rounded-lg"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
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
              {blogToDelete && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {blogToDelete.imageInfo?.hasImage ? (
                      <div 
                        className="h-16 w-16 rounded-lg bg-cover bg-center flex-shrink-0"
                        style={{ backgroundImage: `url(${blogService.getBlogImageUrl(blogToDelete)})` }}
                      />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
                        <Eye className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{blogToDelete.title}</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {blogToDelete.category} • {blogToDelete.views} views • {blogToDelete.likes} likes
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-medium text-red-900">Warning: This action cannot be undone</p>
                    <p className="text-sm text-red-700 mt-1">
                      All data associated with this blog post will be permanently deleted.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Delete
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
          <h1 className="text-3xl font-bold text-gray-900">Blog Management</h1>
          <p className="mt-1 text-gray-600">Create and manage blog posts</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/blog/create"
            className="btn-primary flex items-center gap-2 w-fit"
          >
            <Plus className="h-5 w-5" />
            New Blog Post
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="admin-card">
          <p className="text-sm text-gray-600">Total Posts</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalBlogs}</p>
        </div>
        <div className="admin-card">
          <p className="text-sm text-gray-600">With Images</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{stats.blogsWithImages}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.blogsWithImages > 0 ? Math.round((stats.blogsWithImages / stats.totalBlogs) * 100) : 0}% coverage
          </p>
        </div>
        <div className="admin-card">
          <p className="text-sm text-gray-600">Total Images</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{formatFileSize(stats.totalImageSize)}</p>
        </div>
        <div className="admin-card">
          <p className="text-sm text-gray-600">Avg. Image Size</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.avgImageSize > 0 ? formatFileSize(stats.avgImageSize) : '0 Bytes'}
          </p>
        </div>
        <div className="admin-card">
          <p className="text-sm text-gray-600">Max Image Size</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats.maxImageSize > 0 ? formatFileSize(stats.maxImageSize) : '0 Bytes'}
          </p>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blog posts by title, category, author, or tags..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
              disabled={refreshing}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-transparent"
            disabled={refreshing}
          >
            <option value="all">All Posts</option>
            <option value="featured">Featured</option>
            <option value="published">Published</option>
            <option value="draft">Drafts</option>
          </select>
          <button 
            className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={refreshing}
          >
            <Filter className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        itemLabel="post"
        itemLabelPlural="posts"
        onClear={bulk.clear}
        onDeleteClick={() => setShowBulkDeleteModal(true)}
      />

      <BulkDeleteModal
        open={showBulkDeleteModal}
        count={bulk.selectedCount}
        itemLabel="post"
        itemLabelPlural="posts"
        deleting={bulkDeleting}
        onCancel={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDeleteConfirm}
      />

      {/* Blog Posts Table */}
      <div className="bg-white rounded-xl shadow-adventure border border-gray-200 overflow-hidden">
        {refreshing ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-600">Refreshing blog posts...</p>
          </div>
        ) : filteredBlogs.length === 0 && blogs.length > 0 ? (
          <EmptyState
            icon={Search}
            title="No blog posts match your search"
            description="Try a different search term or filter."
            action={{
              label: 'Clear Filters',
              onClick: () => {
                setSearchQuery('')
                setFilter('all')
              },
            }}
          />
        ) : filteredBlogs.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No blog posts yet"
            description="Write your first post to start sharing fitness tips and updates."
            action={{ label: 'Create Post', icon: Plus, href: '/admin/blog/create' }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 w-12">
                    <input
                      type="checkbox"
                      checked={bulk.isAllSelected}
                      onChange={bulk.toggleAll}
                      className="h-4 w-4 text-accent-500 focus:ring-accent-500 rounded"
                    />
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[250px]">Title</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Image</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Engagement</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Published</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBlogs.map((blog) => (
                  <tr key={blog.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={bulk.isSelected(blog.id)}
                        onChange={() => bulk.toggle(blog.id)}
                        className="h-4 w-4 text-accent-500 focus:ring-accent-500 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{blog.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-gray-500 truncate">By {blog.author}</p>
                          {blog.featured && (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700 rounded flex-shrink-0">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-700">
                        {blog.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {blog.imageInfo?.hasImage ? (
                          <>
                            <div 
                              className="h-8 w-8 rounded bg-cover bg-center flex-shrink-0"
                              style={{ backgroundImage: `url(${blogService.getBlogImageUrl(blog)})` }}
                            />
                            <span className="text-xs text-gray-500 truncate max-w-[100px]">
                              {blog.imageInfo.filename || 'Image'}
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">No image</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                        blog.published !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {blog.published !== false ? 'Published' : 'Draft'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3 text-gray-400" />
                            <span className="font-medium text-sm">{blog.views.toLocaleString()}</span>
                          </div>
                          <span className="text-xs text-gray-500">views</span>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center gap-1">
                            <span className="text-red-500">❤️</span>
                            <span className="font-medium text-sm">{blog.likes}</span>
                          </div>
                          <span className="text-xs text-gray-500">likes</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        {blogService.formatDate(blog.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/blog/edit/${blog.id}`}
                          className="p-2 hover:bg-accent-50 rounded-lg transition-colors text-accent-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(blog)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title="Delete"
                          disabled={deleting}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Info */}
        {filteredBlogs.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Showing <span className="font-medium">{filteredBlogs.length}</span> of{' '}
                <span className="font-medium">{blogs.length}</span> blog posts
              </div>
              <div>
                {blogs.length > filteredBlogs.length && (
                  <span className="text-gray-400">
                    ({blogs.length - filteredBlogs.length} hidden by filters)
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}