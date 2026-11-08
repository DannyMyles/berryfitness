'use client'

import { money } from '@/app/lib/money'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit, Trash2, RefreshCw, X, Trash2 as TrashIcon, ShoppingBag } from 'lucide-react'
import toast from 'react-hot-toast'
import { productService } from '@/app/api_services/productService'
import { Product } from '@/types/commerce'
import EmptyState from '@/components/ui/EmptyState'
import BulkActionBar from '@/components/ui/BulkActionBar'
import BulkDeleteModal from '@/components/ui/BulkDeleteModal'
import { useBulkSelection } from '@/app/lib/useBulkSelection'
import { runBulkDelete } from '@/app/lib/bulkDelete'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

export default function ProductsManagementPage() {
  useDocumentTitle('Products')
  const [products, setProducts] = useState<Product[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null)
  const [deleting, setDeleting] = useState(false)
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        setShowDeleteModal(false)
      }
    }
    if (showDeleteModal) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDeleteModal])

  const fetchProducts = async () => {
    try {
      setLoading(true)
      const data = await productService.getProducts()
      setProducts(data)
    } catch (error: any) {
      toast.error(error.message || 'Failed to load products')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchProducts()
  }

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product)
    setShowDeleteModal(true)
  }

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return
    setDeleting(true)
    try {
      await productService.admin.deleteProduct(productToDelete.id)
      toast.success('Product deleted')
      setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id))
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete product')
    } finally {
      setDeleting(false)
      setShowDeleteModal(false)
      setProductToDelete(null)
    }
  }

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const bulk = useBulkSelection(filtered, (p) => String(p.id))
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  const handleBulkDeleteConfirm = async () => {
    setBulkDeleting(true)
    const ids = Array.from(bulk.selectedIds)
    const { succeededIds, failedIds } = await runBulkDelete(ids, (id) => productService.admin.deleteProduct(Number(id)))
    if (succeededIds.length > 0) {
      setProducts((prev) => prev.filter((p) => !succeededIds.includes(String(p.id))))
    }
    if (failedIds.length === 0) {
      toast.success(`${succeededIds.length} product${succeededIds.length === 1 ? '' : 's'} deleted`)
    } else if (succeededIds.length === 0) {
      toast.error(`Failed to delete ${failedIds.length} product${failedIds.length === 1 ? '' : 's'}`)
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Products</h1>
            <p className="mt-1 text-gray-600">Manage the Berry Fitness store catalog</p>
          </div>
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
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div ref={modalRef} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Confirm Deletion</h3>
              <button onClick={() => setShowDeleteModal(false)} className="p-2 hover:bg-gray-100 rounded-lg" disabled={deleting}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <div className="space-y-4">
              {productToDelete && (
                <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-3">
                  <img src={productToDelete.images[0]} alt="" className="h-16 w-16 rounded-lg object-contain bg-gray-100 p-1 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-gray-900">{productToDelete.name}</h4>
                    <p className="text-sm text-gray-500">{money(productToDelete.price)}</p>
                  </div>
                </div>
              )}
              <div className="p-4 bg-red-50 border border-red-100 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <TrashIcon className="h-5 w-5 text-red-600" />
                  </div>
                  <p className="text-sm text-red-700">This product will be permanently deleted.</p>
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
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="mt-1 text-gray-600">Manage the Berry Fitness store catalog</p>
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
          <Link href="/admin/products/create" className="btn-primary flex items-center gap-2 w-fit">
            <Plus className="h-5 w-5" />
            New Product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="admin-card">
          <p className="text-sm text-gray-600">Total Products</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{products.length}</p>
        </div>
        <div className="admin-card">
          <p className="text-sm text-gray-600">In Stock</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{products.filter((p) => p.inStock).length}</p>
        </div>
        <div className="admin-card">
          <p className="text-sm text-gray-600">Featured</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{products.filter((p) => p.featured).length}</p>
        </div>
        <div className="admin-card">
          <p className="text-sm text-gray-600">Out of Stock</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{products.filter((p) => !p.inStock).length}</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search products by name or category..."
          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
        />
      </div>

      <BulkActionBar
        selectedCount={bulk.selectedCount}
        itemLabel="product"
        onClear={bulk.clear}
        onDeleteClick={() => setShowBulkDeleteModal(true)}
      />

      <BulkDeleteModal
        open={showBulkDeleteModal}
        count={bulk.selectedCount}
        itemLabel="product"
        deleting={bulkDeleting}
        onCancel={() => setShowBulkDeleteModal(false)}
        onConfirm={handleBulkDeleteConfirm}
      />

      <div className="bg-white rounded-xl shadow-adventure border border-gray-200 overflow-hidden">
        {filtered.length === 0 ? (
          products.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="No products yet"
              description="Add your first product to start building the shop catalog."
              action={{ label: 'Add Product', icon: Plus, href: '/admin/products/create' }}
            />
          ) : (
            <EmptyState
              icon={Search}
              title="No products match your search"
              description="Try a different search term."
              action={{ label: 'Clear Search', onClick: () => setSearchQuery('') }}
            />
          )
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
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 min-w-[250px]">Product</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Category</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Price</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={bulk.isSelected(String(product.id))}
                        onChange={() => bulk.toggle(String(product.id))}
                        className="h-4 w-4 text-accent-500 focus:ring-accent-500 rounded"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <img src={product.images[0]} alt="" className="h-10 w-10 rounded-lg object-contain flex-shrink-0 bg-gray-100 p-0.5" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{product.name}</p>
                          {product.featured && (
                            <span className="inline-block px-2 py-0.5 text-xs font-medium bg-yellow-50 text-yellow-700 rounded">
                              Featured
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-accent-50 text-accent-700">
                        {product.category?.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">{money(product.price)}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {product.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/products/edit/${product.id}`}
                          className="p-2 hover:bg-accent-50 rounded-lg transition-colors text-accent-600"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDeleteClick(product)}
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
