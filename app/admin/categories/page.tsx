'use client'

import { useEffect, useRef, useState } from 'react'
import { Plus, Search, Edit, Trash2, RefreshCw, X, Tags, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { productService } from '@/app/api_services/productService'
import { Category } from '@/types/commerce'
import EmptyState from '@/components/ui/EmptyState'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

export default function CategoriesManagementPage() {
  useDocumentTitle('Categories')
  const [categories, setCategories] = useState<Category[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [showFormModal, setShowFormModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const formModalRef = useRef<HTMLDivElement>(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)
  const [deleting, setDeleting] = useState(false)
  const deleteModalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showFormModal && formModalRef.current && !formModalRef.current.contains(event.target as Node)) {
        setShowFormModal(false)
      }
      if (showDeleteModal && deleteModalRef.current && !deleteModalRef.current.contains(event.target as Node)) {
        setShowDeleteModal(false)
      }
    }
    if (showFormModal || showDeleteModal) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showFormModal, showDeleteModal])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await productService.getCategories()
      setCategories(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load categories')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchCategories()
  }

  const openCreateModal = () => {
    setEditingCategory(null)
    setFormName('')
    setFormDescription('')
    setShowFormModal(true)
  }

  const openEditModal = (category: Category) => {
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
    setSaving(true)
    try {
      if (editingCategory) {
        const updated = await productService.admin.updateCategory(editingCategory.id, {
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        })
        setCategories((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)))
        toast.success('Category updated')
      } else {
        const created = await productService.admin.createCategory({
          name: formName.trim(),
          description: formDescription.trim() || undefined,
        })
        setCategories((prev) => [...prev, { ...created, productCount: 0 }].sort((a, b) => a.name.localeCompare(b.name)))
        toast.success('Category created')
      }
      setShowFormModal(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save category')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return
    setDeleting(true)
    try {
      await productService.admin.deleteCategory(categoryToDelete.id)
      toast.success('Category deleted')
      setCategories((prev) => prev.filter((c) => c.id !== categoryToDelete.id))
      setShowDeleteModal(false)
      setCategoryToDelete(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete category')
    } finally {
      setDeleting(false)
    }
  }

  const filtered = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="space-y-6 p-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-gray-600">Organize the Berry Fitness store catalog</p>
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
      {/* Create / Edit Modal */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={formModalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingCategory ? 'Edit Category' : 'New Category'}
              </h3>
              <button onClick={() => setShowFormModal(false)} className="p-2 hover:bg-gray-100 rounded-lg" disabled={saving}>
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
                  placeholder="e.g. Compression Wear"
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
                  placeholder="Short description shown to customers"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500 resize-none"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  disabled={saving}
                  className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Save Changes' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={deleteModalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-gray-100 rounded-lg" disabled={deleting}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {categoryToDelete && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900">{categoryToDelete.name}</h4>
                  <p className="text-sm text-gray-500 mt-1">{categoryToDelete.productCount} product(s)</p>
                </div>
              )}
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-sm text-red-700">
                    {categoryToDelete && categoryToDelete.productCount > 0
                      ? `This category has ${categoryToDelete.productCount} product(s) — reassign or delete them first.`
                      : 'This category will be permanently deleted.'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 rounded-lg font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleting || (categoryToDelete?.productCount ?? 0) > 0}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="mt-1 text-gray-600">Organize the Berry Fitness store catalog</p>
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
              <p className="text-sm text-gray-600">Total Categories</p>
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
              <p className="text-sm text-gray-600">Total Products</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {categories.reduce((sum, c) => sum + c.productCount, 0)}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <Package className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-adventure border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          categories.length === 0 ? (
            <EmptyState
              icon={Tags}
              title="No categories yet"
              description="Create your first category to start organizing the shop catalog."
              action={{ label: 'Create Category', icon: Plus, onClick: openCreateModal }}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No categories match your search"
              description="Try a different search term."
              action={{ label: 'Clear Search', onClick: () => setSearchQuery('') }}
            />
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[200px]">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Description</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Products</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((category) => (
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
                        {category.productCount}
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
                          onClick={() => handleDeleteClick(category)}
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
    </div>
  )
}
