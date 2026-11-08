'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Save, ArrowLeft, Upload, Link as LinkIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { productService, ProductImageInput } from '@/app/api_services/productService'
import { Category, Product } from '@/types/commerce'

export type ProductFormValues = {
  name: string
  description: string
  price: number
  categoryId: number
  images: ProductImageInput[]
  sizes: string[]
  colors: string[]
  inStock: boolean
  featured: boolean
  isNew: boolean
}

interface ProductFormProps {
  initial?: Product
  onSubmit: (values: ProductFormValues) => Promise<void>
  submitLabel: string
}

interface ImageSlot {
  key: string
  type: 'existing' | 'upload' | 'url'
  file?: File
  previewUrl: string
  url?: string
  color: string
}

function toLines(value: string): string[] {
  return value
    .split(/\r?\n|,/)
    .map((v) => v.trim())
    .filter(Boolean)
}

function newKey(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`
}

export default function ProductForm({ initial, onSubmit, submitLabel }: ProductFormProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [price, setPrice] = useState(initial?.price?.toString() ?? '')
  const [categoryId, setCategoryId] = useState(initial?.category?.id?.toString() ?? '')
  const [sizes, setSizes] = useState((initial?.sizes ?? []).join(', '))
  const [colors, setColors] = useState((initial?.colors ?? []).join(', '))
  const [inStock, setInStock] = useState(initial?.inStock ?? true)
  const [featured, setFeatured] = useState(initial?.featured ?? false)
  const [isNew, setIsNew] = useState(initial?.isNew ?? false)

  const [imageSlots, setImageSlots] = useState<ImageSlot[]>(
    (initial?.imageDetails ?? []).map((img) => ({
      key: newKey(),
      type: 'existing' as const,
      previewUrl: img.url,
      url: img.url,
      color: img.color ?? '',
    }))
  )

  const colorOptions = toLines(colors)

  useEffect(() => {
    productService
      .getCategories()
      .then((cats) => {
        setCategories(cats)
        if (!categoryId && cats[0]) setCategoryId(cats[0].id.toString())
      })
      .catch(() => toast.error('Failed to load categories'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilesSelected = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newSlots: ImageSlot[] = Array.from(files).map((file) => ({
      key: newKey(),
      type: 'upload',
      file,
      previewUrl: URL.createObjectURL(file),
      color: '',
    }))
    setImageSlots((prev) => [...prev, ...newSlots])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleAddUrlSlot = () => {
    setImageSlots((prev) => [...prev, { key: newKey(), type: 'url', previewUrl: '', url: '', color: '' }])
  }

  const handleRemoveSlot = (key: string) => {
    setImageSlots((prev) => {
      const slot = prev.find((s) => s.key === key)
      if (slot?.type === 'upload' && slot.previewUrl) URL.revokeObjectURL(slot.previewUrl)
      return prev.filter((s) => s.key !== key)
    })
  }

  const handleSlotColorChange = (key: string, color: string) => {
    setImageSlots((prev) => prev.map((s) => (s.key === key ? { ...s, color } : s)))
  }

  const handleSlotUrlChange = (key: string, url: string) => {
    setImageSlots((prev) => prev.map((s) => (s.key === key ? { ...s, url, previewUrl: url } : s)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const validSlots = imageSlots.filter((s) => s.type !== 'url' || (s.url && s.url.trim().length > 0))
    if (!name || !description || !price || !categoryId || validSlots.length === 0) {
      toast.error('Name, description, price, category, and at least one image are required')
      return
    }

    const priceValue = Number(price)
    if (!Number.isFinite(priceValue) || priceValue <= 0) {
      toast.error('Price must be a positive number')
      return
    }

    setSaving(true)
    try {
      await onSubmit({
        name,
        description,
        price: priceValue,
        categoryId: Number(categoryId),
        images: validSlots.map((s) => ({
          type: s.type,
          file: s.type === 'upload' ? s.file : undefined,
          url: s.type !== 'upload' ? s.url : undefined,
          color: s.color || null,
        })),
        sizes: toLines(sizes),
        colors: toLines(colors),
        inStock,
        featured,
        isNew,
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to save product')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-xl shadow-adventure border border-gray-200 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={200}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            placeholder="Berry Fitness Hoodie"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            maxLength={5000}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (USD)</label>
            <input
              type="number"
              min={0}
              step="1"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <Link
                href="/admin/categories"
                target="_blank"
                className="text-xs text-accent-600 hover:text-accent-700 font-medium"
              >
                + Manage categories
              </Link>
            </div>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sizes (comma separated)</label>
            <input
              type="text"
              value={sizes}
              onChange={(e) => setSizes(e.target.value)}
              placeholder="S, M, L, XL, XXL"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Colors (comma separated)</label>
            <input
              type="text"
              value={colors}
              onChange={(e) => setColors(e.target.value)}
              placeholder="Black, White"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent-500"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">Images</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:text-accent-700"
              >
                <Upload className="h-3.5 w-3.5" />
                Upload from my computer
              </button>
              <button
                type="button"
                onClick={handleAddUrlSlot}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-accent-600 hover:text-accent-700"
              >
                <LinkIcon className="h-3.5 w-3.5" />
                Add image path
              </button>
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFilesSelected(e.target.files)}
          />

          {imageSlots.length === 0 ? (
            <label
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-10 text-gray-400 hover:border-accent-400 hover:text-accent-500 cursor-pointer transition-colors"
            >
              <Upload className="h-6 w-6" />
              <span className="text-sm">Click to upload images, or add an image path above</span>
            </label>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {imageSlots.map((slot) => (
                <div key={slot.key} className="relative border border-gray-200 rounded-lg p-2 bg-gray-50">
                  <button
                    type="button"
                    onClick={() => handleRemoveSlot(slot.key)}
                    className="absolute top-1 right-1 z-10 p-1 bg-white rounded-full shadow hover:bg-red-50 hover:text-red-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>

                  {slot.type === 'url' ? (
                    <div className="space-y-2">
                      <div className="h-16 w-full bg-white rounded border flex items-center justify-center overflow-hidden">
                        {slot.previewUrl ? (
                          <img src={slot.previewUrl} alt="" className="h-full w-full object-contain p-1" />
                        ) : (
                          <LinkIcon className="h-5 w-5 text-gray-300" />
                        )}
                      </div>
                      <input
                        type="text"
                        value={slot.url ?? ''}
                        onChange={(e) => handleSlotUrlChange(slot.key, e.target.value)}
                        placeholder="/images/shop/t-shirt.jpg"
                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded font-mono"
                      />
                    </div>
                  ) : (
                    <img src={slot.previewUrl} alt="" className="h-16 w-full object-contain bg-white rounded border p-1" />
                  )}

                  <select
                    value={slot.color}
                    onChange={(e) => handleSlotColorChange(slot.key, e.target.value)}
                    className="w-full mt-2 px-2 py-1 text-xs border border-gray-300 rounded"
                  >
                    <option value="">No color (all)</option>
                    {colorOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Tagging an image with a color lets shoppers see that specific image when they pick that color on the product page.
          </p>
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={inStock} onChange={(e) => setInStock(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-gray-700">In Stock</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-gray-700">Featured</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} className="w-4 h-4" />
            <span className="text-sm text-gray-700">New Arrival</span>
          </label>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => router.push('/admin/products')}
          className="flex items-center gap-2 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </button>
      </div>
    </form>
  )
}
