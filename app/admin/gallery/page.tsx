'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Plus, Search, Edit, Trash2, RefreshCw, X, Tags, Image as ImageIcon,
  Upload, UploadCloud,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { galleryService, GalleryCategory, GalleryImage } from '@/app/api_services/galleryService'
import EmptyState from '@/components/ui/EmptyState'
import BulkActionBar from '@/components/ui/BulkActionBar'
import BulkDeleteModal from '@/components/ui/BulkDeleteModal'
import { useBulkSelection } from '@/app/lib/useBulkSelection'
import { runBulkDelete } from '@/app/lib/bulkDelete'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

interface FilePreview {
  file: File
  previewUrl: string
}

export default function GalleryManagementPage() {
  useDocumentTitle('Gallery')
  const [categories, setCategories] = useState<GalleryCategory[]>([])
  const [images, setImages] = useState<GalleryImage[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')

  // Category create/edit modal
  const [showFormModal, setShowFormModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<GalleryCategory | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [savingCategory, setSavingCategory] = useState(false)
  const formModalRef = useRef<HTMLDivElement>(null)

  // Category delete modal
  const [showDeleteCategoryModal, setShowDeleteCategoryModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<GalleryCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState(false)
  const deleteCategoryModalRef = useRef<HTMLDivElement>(null)

  // Image delete modal
  const [showDeleteImageModal, setShowDeleteImageModal] = useState(false)
  const [imageToDelete, setImageToDelete] = useState<GalleryImage | null>(null)
  const [deletingImage, setDeletingImage] = useState(false)
  const deleteImageModalRef = useRef<HTMLDivElement>(null)

  // Upload panel
  const [uploadCategoryId, setUploadCategoryId] = useState('')
  const [selectedFiles, setSelectedFiles] = useState<FilePreview[]>([])
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchAll()
  }, [])

  // Keep the upload category valid: default to the first category once any
  // exist, and fall back if the previously-selected one gets deleted.
  useEffect(() => {
    if (categories.length === 0) {
      setUploadCategoryId('')
      return
    }
    if (!categories.some((c) => c.id === uploadCategoryId)) {
      setUploadCategoryId(categories[0].id)
    }
  }, [categories, uploadCategoryId])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFormModal && formModalRef.current && !formModalRef.current.contains(event.target as Node)) {
        setShowFormModal(false)
      }
      if (
        showDeleteCategoryModal &&
        deleteCategoryModalRef.current &&
        !deleteCategoryModalRef.current.contains(event.target as Node)
      ) {
        setShowDeleteCategoryModal(false)
      }
      if (
        showDeleteImageModal &&
        deleteImageModalRef.current &&
        !deleteImageModalRef.current.contains(event.target as Node)
      ) {
        setShowDeleteImageModal(false)
      }
    }
    if (showFormModal || showDeleteCategoryModal || showDeleteImageModal) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFormModal, showDeleteCategoryModal, showDeleteImageModal])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [cats, imgs] = await Promise.all([galleryService.getCategories(), galleryService.getImages()])
      setCategories(cats)
      setImages(imgs)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load gallery')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchAll()
  }

  // --- Category CRUD ---

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormName('')
    setFormDescription('')
    setShowFormModal(true)
  }

  const openEditModal = (category: GalleryCategory) => {
    setEditingCategory(category)
    setFormName(category.name)
    setFormDescription(category.description ?? '')
    setShowFormModal(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formName.trim()) {
      toast.error('Category name is required')
      return
    }
    setSavingCategory(true)
    try {
      if (editingCategory) {
        const updated = await galleryService.admin.updateCategory(editingCategory.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        })
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
        toast.success('Category updated')
      } else {
        const created = await galleryService.admin.createCategory({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        })
        setCategories((prev) => [...prev, { ...created, imageCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)))
        toast.success('Category created')
      }
      setShowFormModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category')
    } finally {
      setSavingCategory(false)
    }
  }

  const handleDeleteCategoryClick = (category: GalleryCategory) => {
    setCategoryToDelete(category)
    setShowDeleteCategoryModal(true)
  }

  const handleDeleteCategoryConfirm = async () => {
    if (!categoryToDelete) return
    setDeletingCategory(true)
    try {
      await galleryService.admin.deleteCategory(categoryToDelete.id)
      toast.success('Category deleted')
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id))
      setShowDeleteCategoryModal(false)
      setCategoryToDelete(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category')
    } finally {
      setDeletingCategory(false)
    }
  }

  // --- Upload ---

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return

    const invalid = files.find((f) => !f.type.startsWith('image/') || f.size > 5 * 1024 * 1024)
    if (invalid) {
      toast.error('Each file must be an image under 5MB')
      return
    }

    const previews = files.map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    setSelectedFiles(previews)
    setUploadTitle('')
    e.target.value = ''
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const clearSelectedFiles = () => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl))
    setSelectedFiles([])
    setUploadTitle('')
  }

  const handleUpload = async () => {
    if (!uploadCategoryId) {
      toast.error('Choose a category first')
      return
    }
    if (selectedFiles.length === 0) {
      toast.error('Select at least one photo to upload')
      return
    }

    setUploading(true)
    try {
      if (selectedFiles.length === 1) {
        const image = await galleryService.admin.uploadSingle(
          uploadCategoryId,
          selectedFiles[0].file,
          uploadTitle.trim() || undefined
        )
        setImages((prev) => [image, ...prev])
        toast.success('Photo uploaded')
      } else {
        const uploaded = await galleryService.admin.uploadBulk(
          uploadCategoryId,
          selectedFiles.map((f) => f.file)
        )
        setImages((prev) => [...uploaded, ...prev])
        toast.success(`${uploaded.length} photos uploaded`)
      }
      setCategories((prev) =>
        prev.map((c) =>
          c.id === uploadCategoryId ? { ...c, imageCount: c.imageCount + selectedFiles.length } : c
        )
      )
      clearSelectedFiles()
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload photo(s)')
    } finally {
      setUploading(false)
    }
  }

  // --- Image delete ---

  const handleDeleteImageClick = (image: GalleryImage) => {
    setImageToDelete(image)
    setShowDeleteImageModal(true)
  }

  const handleDeleteImageConfirm = async () => {
    if (!imageToDelete) return
    setDeletingImage(true)
    try {
      try {
        await galleryService.admin.deleteImage(imageToDelete.id)
        toast.success('Photo deleted')
      } catch (error: any) {
        // Already gone server-side (stale grid, double-click, etc.) — the
        // end state the user wants is the same either way, so don't scare
        // them with an error for something that isn't one.
        if (error?.status === 404) {
          toast.success('Photo already removed')
        } else {
          throw error
        }
      }
      setImages((prev) => prev.filter((img) => img.id !== imageToDelete.id))
      setCategories((prev) =>
        prev.map((c) =>
          c.id === imageToDelete.categoryId ? { ...c, imageCount: Math.max(0, c.imageCount - 1) } : c
        )
      )
      setShowDeleteImageModal(false)
      setImageToDelete(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete photo')
    } finally {
      setDeletingImage(false)
    }
  }

  const categoryById = (id: string) => categories.find((c) => c.id === id)

  const filteredImages = images.filter((img) => {
    const matchesFilter = activeFilter === 'all' || img.categoryId === activeFilter
    const matchesSearch =
      !searchQuery ||
      (img.title ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (categoryById(img.categoryId)?.name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const bulk = useBulkSelection(filteredImages, (img) => img.id)
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleting(true)
    const ids = Array.from(bulk.selectedIds)
    const { succeededIds, failedIds } = await runBulkDelete(ids, async (id) => {
      try {
        await galleryService.admin.deleteImage(id)
      } catch (error: any) {
        // Already gone server-side counts as a successful outcome here too.
        if (error?.status === 404) return
        throw error
      }
    })
    if (succeededIds.length > 0) {
      const removedImages = images.filter((img) => succeededIds.includes(img.id))
      setImages((prev) => prev.filter((img) => !succeededIds.includes(img.id)))
      setCategories((prev) =>
        prev.map((c) => {
          const removedCount = removedImages.filter((img) => img.categoryId === c.id).length
          return removedCount > 0 ? { ...c, imageCount: Math.max(0, c.imageCount - removedCount) } : c
        })
      )
    }
    if (failedIds.length === 0) {
      toast.success(`${succeededIds.length} photo${succeededIds.length === 1 ? '' : 's'} deleted`)
    } else if (succeededIds.length === 0) {
      toast.error(`Failed to delete ${failedIds.length} photo${failedIds.length === 1 ? '' : 's'}`)
    } else {
      toast.success(`${succeededIds.length} deleted, ${failedIds.length} failed`)
    }
    bulk.clear()
    setBulkDeleting(false)
    setShowBulkDeleteModal(false)
  }

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
          <p className="mt-1 text-gray-600">Manage photo categories and uploads</p>
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
      {/* Category Create/Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={formModalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-100 rounded-lg" disabled={savingCategory}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Gym Events"
                  maxLength={100}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  autoFocus
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Short description (optional)"
                  rows={3}
                  maxLength={1000}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  disabled={savingCategory}
                  className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {savingCategory ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Delete Modal */}
      {showDeleteCategoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={deleteCategoryModalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
              <button onClick={() => setShowDeleteCategoryModal(false)} className="p-2 hover:bg-gray-100 rounded-lg" disabled={deletingCategory}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {categoryToDelete && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{categoryToDelete.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{categoryToDelete.imageCount} photo(s)</p>
                </div>
              )}
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-sm text-red-700">
                    {categoryToDelete && categoryToDelete.imageCount > 0
                      ? `This category has ${categoryToDelete.imageCount} photo(s) — delete them first.`
                      : 'This category will be permanently deleted.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDeleteCategoryModal(false)}
                  disabled={deletingCategory}
                  className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteCategoryConfirm}
                  disabled={deletingCategory || (categoryToDelete?.imageCount ?? 0) > 0}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deletingCategory ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Delete Modal */}
      {showDeleteImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={deleteImageModalRef} className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Delete Photo</h3>
              <button onClick={() => setShowDeleteImageModal(false)} className="p-2 hover:bg-gray-100 rounded-lg" disabled={deletingImage}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            {imageToDelete && (
              <img
                src={galleryService.getImageUrl(imageToDelete)}
                alt={imageToDelete.title ?? ''}
                className="w-full h-40 object-cover rounded-lg mb-4"
              />
            )}
            <p className="text-sm text-gray-600 mb-4">This photo will be permanently deleted.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteImageModal(false)}
                disabled={deletingImage}
                className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg font-medium disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteImageConfirm}
                disabled={deletingImage}
                className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deletingImage ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gallery</h1>
          <p className="mt-1 text-gray-600">Manage photo categories and uploads</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={openCreateModal} className="btn-primary flex items-center gap-2 w-fit">
            <Plus className="h-5 w-5" />
            New Category
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Categories</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{categories.length}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Tags className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="admin-card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Photos</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{images.length}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <ImageIcon className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Categories list */}
      <div className="bg-white rounded-xl shadow-adventure border border-gray-200 overflow-hidden">
        {categories.length === 0 ? (
          <EmptyState
            icon={Tags}
            title="No categories yet"
            description="Create a category (e.g. Training, Gym Events) before uploading photos."
            action={{ label: 'Create Category', icon: Plus, onClick: openCreateModal }}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[200px]">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Photos</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {categories.map((category) => (
                  <tr key={category.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{category.name}</p>
                      <p className="text-xs text-gray-400">/{category.slug}</p>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                      {category.description || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-700">
                        {category.imageCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(category)}
                          className="p-2 hover:bg-accent-50 rounded-lg transition-colors text-accent-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategoryClick(category)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-600"
                          title="Delete"
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
      </div>

      {/* Upload panel */}
      <div className="bg-white rounded-xl shadow-adventure border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <span className="p-2 bg-accent-50 rounded-lg">
            <UploadCloud className="h-5 w-5 text-accent-600" />
          </span>
          Upload Photos
        </h3>

        {categories.length === 0 ? (
          <p className="text-sm text-gray-500">Create a category first before uploading photos.</p>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                1. Choose a category *
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setUploadCategoryId(c.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium border transition-colors ${
                      uploadCategoryId === c.id
                        ? 'bg-accent-500 border-accent-500 text-white'
                        : 'bg-white border-gray-300 text-gray-700 hover:border-accent-400 hover:bg-accent-50'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedFiles.length === 1 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title (optional)</label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    placeholder="e.g. Morning HIIT Session"
                    maxLength={200}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">2. Add photos</label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-xl py-8 cursor-pointer hover:border-accent-400 hover:bg-accent-50/30 transition-colors">
                <input type="file" accept="image/*" multiple onChange={handleFileSelect} className="hidden" disabled={uploading} />
                <Upload className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Click to select one photo, or select multiple for a bulk upload
                </span>
              </label>
              <p className="text-xs text-gray-500 mt-2">
                Each file up to 5MB — JPG, PNG, GIF, or WebP. Uploading to{' '}
                <span className="font-medium text-gray-700">
                  {categories.find((c) => c.id === uploadCategoryId)?.name ?? '…'}
                </span>
                .
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">
                    {selectedFiles.length} photo{selectedFiles.length > 1 ? 's' : ''} selected
                  </p>
                  <button type="button" onClick={clearSelectedFiles} className="text-xs text-gray-500 hover:text-red-600">
                    Clear all
                  </button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {selectedFiles.map((f, i) => (
                    <div key={i} className="relative">
                      <img src={f.previewUrl} alt="" className="h-20 w-20 object-cover rounded-lg border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeSelectedFile(i)}
                        className="absolute -top-1.5 -right-1.5 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        disabled={uploading}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={uploading || selectedFiles.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {uploading ? (
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {uploading
                ? 'Uploading...'
                : selectedFiles.length > 1
                ? `Upload ${selectedFiles.length} Photos`
                : 'Upload Photo'}
            </button>
          </>
        )}
      </div>

      {/* Image grid */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === 'all' ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({images.length})
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveFilter(c.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  activeFilter === c.id ? 'bg-accent-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {c.name} ({c.imageCount})
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            {filteredImages.length > 0 && (
              <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bulk.isAllSelected}
                  onChange={bulk.toggleAll}
                  className="h-4 w-4 text-accent-500 focus:ring-accent-500 rounded"
                />
                Select all
              </label>
            )}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photos..."
                className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 text-sm"
              />
            </div>
          </div>
        </div>

        <BulkActionBar
          selectedCount={bulk.selectedCount}
          itemLabel="photo"
          onClear={bulk.clear}
          onDeleteClick={() => setShowBulkDeleteModal(true)}
        />

        <BulkDeleteModal
          open={showBulkDeleteModal}
          count={bulk.selectedCount}
          itemLabel="photo"
          deleting={bulkDeleting}
          onCancel={() => setShowBulkDeleteModal(false)}
          onConfirm={handleBulkDeleteConfirm}
        />

        {filteredImages.length === 0 ? (
          <div className="bg-white rounded-xl shadow-adventure border border-gray-200">
            {images.length === 0 ? (
              <EmptyState
                icon={ImageIcon}
                title="No photos yet"
                description="Use the upload panel above to add your first photos."
              />
            ) : (
              <EmptyState
                icon={Search}
                title="No photos match your filter"
                description="Try a different category or search term."
                action={{
                  label: 'Clear Filters',
                  onClick: () => {
                    setActiveFilter('all')
                    setSearchQuery('')
                  },
                }}
              />
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map((image) => (
              <div
                key={image.id}
                className={`group relative rounded-xl overflow-hidden border bg-white ${
                  bulk.isSelected(image.id) ? 'border-accent-500 ring-2 ring-accent-200' : 'border-gray-200'
                }`}
              >
                <div className="aspect-square">
                  <img src={galleryService.getImageUrl(image)} alt={image.title ?? ''} className="w-full h-full object-cover" />
                </div>
                <label
                  className={`absolute top-2 left-2 p-0.5 bg-white/90 rounded-md cursor-pointer transition-opacity ${
                    bulk.isSelected(image.id) || bulk.selectedCount > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={bulk.isSelected(image.id)}
                    onChange={() => bulk.toggle(image.id)}
                    className="h-4 w-4 text-accent-500 focus:ring-accent-500 rounded"
                  />
                </label>
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <button
                    onClick={() => handleDeleteImageClick(image)}
                    className="self-end p-1.5 bg-white/90 hover:bg-red-50 rounded-lg text-red-600"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="text-white text-xs">
                    {image.title && <p className="font-medium truncate">{image.title}</p>}
                    <p className="text-white/70 truncate">{categoryById(image.categoryId)?.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
