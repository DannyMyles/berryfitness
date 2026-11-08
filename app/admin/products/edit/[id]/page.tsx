'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import ProductForm, { ProductFormValues } from '@/components/admin/ProductForm'
import { productService } from '@/app/api_services/productService'
import { Product } from '@/types/commerce'
import { useDocumentTitle } from '@/app/lib/useDocumentTitle'

export default function EditProductPage() {
  useDocumentTitle('Edit Product')
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Products are fetched by slug publicly; admin edit only has the numeric
    // id (from the list page), so pull the full list and find it — the
    // catalog is small enough in this milestone that this is simplest.
    productService
      .getProducts()
      .then((all) => {
        const found = all.find((p) => p.id === Number(params.id))
        if (!found) {
          toast.error('Product not found')
          router.push('/admin/products')
          return
        }
        setProduct(found)
      })
      .finally(() => setLoading(false))
  }, [params.id, router])

  const handleSubmit = async (values: ProductFormValues) => {
    await productService.admin.updateProduct(Number(params.id), values)
    toast.success('Product updated')
    router.push('/admin/products')
  }

  if (loading) {
    return (
      <div className="p-8 flex justify-center">
        <div className="h-8 w-8 border-4 border-accent-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="space-y-6 p-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Edit Product</h1>
        <p className="mt-1 text-gray-600">{product.name}</p>
      </div>
      <ProductForm initial={product} onSubmit={handleSubmit} submitLabel="Save Changes" />
    </div>
  )
}
