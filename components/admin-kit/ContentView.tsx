'use client'

import { useState } from 'react'
import { Check, ImagePlus, Pencil, Plus, Star, Trash2, Upload } from 'lucide-react'
import { Banner, Faq, GalleryImage, Testimonial, adminKit, formatDate } from './api'
import { Badge, Button, Card, EmptyState, ErrorState, Field, Modal, PageTitle, SkeletonRows, Toggle, cx, inputClass, toast, useQuery } from './ui'

type Tab = 'faqs' | 'banners' | 'testimonials' | 'gallery'

/** Website content that isn't a service: FAQs, homepage banners/promotions, testimonials. */
export default function ContentView({ showTestimonials = true, showGallery = false }: { showTestimonials?: boolean; showGallery?: boolean }) {
  const [tab, setTab] = useState<Tab>('faqs')
  const tabs: { value: Tab; label: string }[] = [
    { value: 'faqs', label: 'FAQs' },
    { value: 'banners', label: 'Banners & offers' },
    ...(showTestimonials ? [{ value: 'testimonials' as Tab, label: 'Testimonials' }] : []),
    ...(showGallery ? [{ value: 'gallery' as Tab, label: 'Gallery' }] : []),
  ]
  return (
    <div>
      <PageTitle title="Website content" subtitle="Changes appear on the website within a minute." />
      <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={tab === t.value}
            onClick={() => setTab(t.value)}
            className={cx('whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors', tab === t.value ? 'bg-white text-accent-700 shadow-sm' : 'text-gray-600 hover:text-gray-900')}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === 'faqs' && <FaqsPanel />}
      {tab === 'banners' && <BannersPanel />}
      {tab === 'testimonials' && <TestimonialsPanel />}
      {tab === 'gallery' && <GalleryPanel />}
    </div>
  )
}

function useList<T>(key: string, loader: () => Promise<T[]>) {
  const { data, loading, error, reload } = useQuery(key, loader)
  return { items: data ?? [], loading: loading && !data, error, load: reload }
}

// --- FAQs --------------------------------------------------------------------------

function FaqsPanel() {
  const { items, loading, error, load } = useList('faqs', adminKit.faqs)
  const [editing, setEditing] = useState<Faq | 'new' | null>(null)

  const remove = async (f: Faq) => {
    if (!window.confirm('Delete this FAQ?')) return
    try {
      await adminKit.deleteFaq(f.id)
      toast('FAQ deleted.')
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete', 'error')
    }
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New FAQ
        </Button>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonRows rows={3} />
      ) : items.length === 0 ? (
        <EmptyState title="No FAQs yet." text="Answer the questions customers ask most — they appear on the contact page." />
      ) : (
        <ul className="space-y-3">
          {items.map((f) => (
            <li key={f.id}>
              <Card className={cx('flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between', !f.published && 'opacity-60')}>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900">{f.question}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-600">{f.answer}</p>
                  <p className="mt-2 flex gap-2 text-xs text-gray-400">
                    {f.category && <Badge value="contact" label={f.category} />}
                    {!f.published && <Badge value="cancelled" label="hidden" />}
                    <span>Order {f.order}</span>
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(f)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => remove(f)} aria-label="Delete FAQ">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
      {editing && <FaqEditor faq={editing === 'new' ? null : editing} nextOrder={items.length} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}

function FaqEditor({ faq, nextOrder, onClose, onSaved }: { faq: Faq | null; nextOrder: number; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState({ question: faq?.question ?? '', answer: faq?.answer ?? '', category: faq?.category ?? '', order: String(faq?.order ?? nextOrder), published: faq?.published ?? true })
  const [saving, setSaving] = useState(false)
  const save = async () => {
    if (d.question.trim().length < 3 || !d.answer.trim()) {
      toast('Add a question and an answer.', 'error')
      return
    }
    setSaving(true)
    try {
      await adminKit.saveFaq(faq?.id ?? null, { question: d.question.trim(), answer: d.answer.trim(), category: d.category.trim() || null, order: Number(d.order) || 0, published: d.published })
      toast('FAQ saved.')
      onSaved()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'error')
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal open onClose={onClose} title={faq ? 'Edit FAQ' : 'New FAQ'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></>}>
      <div className="space-y-4">
        <Field label="Question">
          <input value={d.question} onChange={(e) => setD({ ...d, question: e.target.value })} maxLength={300} className={inputClass} />
        </Field>
        <Field label="Answer">
          <textarea rows={5} value={d.answer} onChange={(e) => setD({ ...d, answer: e.target.value })} maxLength={5000} className={inputClass} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category" hint="optional">
            <input value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })} maxLength={60} className={inputClass} placeholder="Booking" />
          </Field>
          <Field label="Order">
            <input type="number" min={0} value={d.order} onChange={(e) => setD({ ...d, order: e.target.value })} className={inputClass} />
          </Field>
        </div>
        <Toggle checked={d.published} onChange={(v) => setD({ ...d, published: v })} label="Published" />
      </div>
    </Modal>
  )
}

// --- Banners -----------------------------------------------------------------------

function bannerState(b: Banner) {
  const now = Date.now()
  if (!b.active) return { value: 'cancelled', label: 'off' }
  if (b.startsAt && new Date(b.startsAt).getTime() > now) return { value: 'queued', label: 'scheduled' }
  if (b.endsAt && new Date(b.endsAt).getTime() < now) return { value: 'skipped', label: 'ended' }
  return { value: 'sent', label: 'live' }
}

function BannersPanel() {
  const { items, loading, error, load } = useList('banners', adminKit.banners)
  const [editing, setEditing] = useState<Banner | 'new' | null>(null)
  const remove = async (b: Banner) => {
    if (!window.confirm(`Delete “${b.title}”?`)) return
    try {
      await adminKit.deleteBanner(b.id)
      toast('Banner deleted.')
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete', 'error')
    }
  }
  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">Placement “home” shows on the homepage; “corporate” on the corporate page.</p>
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> New banner
        </Button>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonRows rows={2} />
      ) : items.length === 0 ? (
        <EmptyState title="No banners yet." text="Promote an offer, a new programme or a seasonal event — with optional start and end dates." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((b) => {
            const s = bannerState(b)
            return (
              <Card key={b.id} className="overflow-hidden">
                <div className="relative h-32 bg-gray-800">
                  {b.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image} alt="" className="h-full w-full object-cover opacity-70" />
                  )}
                  <div className="absolute inset-0 flex flex-col justify-end p-4 text-white">
                    {b.badge && <span className="mb-1 w-fit rounded-full bg-accent-500 px-2 py-0.5 text-xs font-bold">{b.badge}</span>}
                    <p className="font-bold">{b.title}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 p-4">
                  <div className="text-sm text-gray-500">
                    <span className="mr-2 inline-flex gap-1">
                      <Badge value={s.value} label={s.label} />
                      <Badge value="contact" label={b.placement} />
                    </span>
                    {(b.startsAt || b.endsAt) && <span>{formatDate(b.startsAt)} – {formatDate(b.endsAt)}</span>}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="secondary" onClick={() => setEditing(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => remove(b)} aria-label="Delete banner">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}
      {editing && <BannerEditor banner={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}

const toDateInput = (iso: string | null) => (iso ? new Date(iso).toISOString().slice(0, 10) : '')

function BannerEditor({ banner, onClose, onSaved }: { banner: Banner | null; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState({
    placement: banner?.placement ?? 'home',
    title: banner?.title ?? '',
    subtitle: banner?.subtitle ?? '',
    badge: banner?.badge ?? '',
    imageUrl: banner?.image && !banner.image.startsWith('/uploads/') ? banner.image : '',
    ctaLabel: banner?.ctaLabel ?? '',
    ctaUrl: banner?.ctaUrl ?? '',
    startsAt: toDateInput(banner?.startsAt ?? null),
    endsAt: toDateInput(banner?.endsAt ?? null),
    order: String(banner?.order ?? 0),
    active: banner?.active ?? true,
  })
  const [file, setFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setD({ ...d, [k]: e.target.value })
  const save = async () => {
    if (!d.title.trim()) {
      toast('Add a title.', 'error')
      return
    }
    if (d.startsAt && d.endsAt && d.endsAt < d.startsAt) {
      toast('The end date must be after the start date.', 'error')
      return
    }
    const form = new FormData()
    Object.entries({ ...d, active: String(d.active), endsAt: d.endsAt ? `${d.endsAt}T23:59:59` : '' }).forEach(([k, v]) => form.set(k, v))
    if (file) form.set('image', file)
    setSaving(true)
    try {
      await adminKit.saveBanner(banner?.id ?? null, form)
      toast('Banner saved.')
      onSaved()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'error')
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal open onClose={onClose} title={banner ? 'Edit banner' : 'New banner'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" className="sm:col-span-2">
          <input value={d.title} onChange={set('title')} maxLength={160} className={inputClass} />
        </Field>
        <Field label="Text" hint="optional" className="sm:col-span-2">
          <textarea rows={2} value={d.subtitle} onChange={set('subtitle')} maxLength={1000} className={inputClass} />
        </Field>
        <Field label="Badge" hint="e.g. Limited offer">
          <input value={d.badge} onChange={set('badge')} maxLength={60} className={inputClass} />
        </Field>
        <Field label="Placement">
          <input list="banner-placements" value={d.placement} onChange={set('placement')} maxLength={40} className={inputClass} />
          <datalist id="banner-placements">
            <option value="slider">Home slideshow</option>
            <option value="home" />
            <option value="corporate" />
            <option value="promo" />
          </datalist>
        </Field>
        <Field label="Button label" hint="optional">
          <input value={d.ctaLabel} onChange={set('ctaLabel')} maxLength={60} className={inputClass} />
        </Field>
        <Field label="Button link" hint="/page or https://…">
          <input value={d.ctaUrl} onChange={set('ctaUrl')} maxLength={512} className={inputClass} />
        </Field>
        <Field label="Show from" hint="optional">
          <input type="date" value={d.startsAt} onChange={set('startsAt')} className={inputClass} />
        </Field>
        <Field label="Show until" hint="optional">
          <input type="date" value={d.endsAt} onChange={set('endsAt')} className={inputClass} />
        </Field>
        <Field label="Upload image" className="sm:col-span-2">
          <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-accent-50 file:px-3 file:py-2 file:font-semibold file:text-accent-700" />
        </Field>
        <Field label="…or image URL" className="sm:col-span-2">
          <input value={d.imageUrl} onChange={set('imageUrl')} className={inputClass} placeholder="https://… or /images/…" />
        </Field>
        <Field label="Order">
          <input type="number" min={0} value={d.order} onChange={set('order')} className={inputClass} />
        </Field>
        <div className="flex items-end">
          <Toggle checked={d.active} onChange={(v) => setD({ ...d, active: v })} label="Active" />
        </div>
      </div>
    </Modal>
  )
}

// --- Testimonials ------------------------------------------------------------------

function TestimonialsPanel() {
  const { items, loading, error, load } = useList('testimonials', adminKit.testimonials)
  const [editing, setEditing] = useState<Testimonial | 'new' | null>(null)
  const approve = async (t: Testimonial, isActive: boolean) => {
    try {
      await adminKit.setTestimonialActive(t.id, isActive)
      toast(isActive ? 'Testimonial approved — now on the website.' : 'Testimonial hidden.')
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update', 'error')
    }
  }
  const remove = async (t: Testimonial) => {
    if (!window.confirm(`Delete ${t.name}'s testimonial?`)) return
    try {
      await adminKit.deleteTestimonial(t.id)
      toast('Testimonial deleted.')
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete', 'error')
    }
  }
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setEditing('new')}>
          <Plus className="h-4 w-4" /> Add testimonial
        </Button>
      </div>
      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading ? (
        <SkeletonRows rows={2} />
      ) : items.length === 0 ? (
        <EmptyState title="No testimonials yet." text="Add real feedback from customers (with their permission). The section appears on the homepage once one is approved." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {items.map((t) => (
            <Card key={t.id} className="flex flex-col p-4">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="font-semibold text-gray-900">
                  {t.name} <span className="font-normal text-gray-500">· {t.role}</span>
                </p>
                <Badge value={t.isActive ? 'confirmed' : 'pending'} label={t.isActive ? 'approved' : 'awaiting review'} />
              </div>
              <div className="mb-2 flex gap-0.5">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star key={i} className={cx('h-4 w-4', i < t.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200')} />
                ))}
              </div>
              <p className="mb-4 flex-1 text-sm text-gray-600">“{t.content}”</p>
              <div className="flex flex-wrap gap-2">
                {t.isActive ? (
                  <Button size="sm" variant="secondary" onClick={() => approve(t, false)}>Hide</Button>
                ) : (
                  <Button size="sm" variant="dark" onClick={() => approve(t, true)}>
                    <Check className="h-4 w-4" /> Approve
                  </Button>
                )}
                <Button size="sm" variant="secondary" onClick={() => setEditing(t)}>
                  <Pencil className="h-4 w-4" /> Edit
                </Button>
                <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => remove(t)} aria-label="Delete testimonial">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
      {editing && <TestimonialEditor item={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </div>
  )
}

function TestimonialEditor({ item, onClose, onSaved }: { item: Testimonial | null; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState({ name: item?.name ?? '', role: item?.role ?? '', company: item?.company ?? '', content: item?.content ?? '', rating: String(item?.rating ?? 5), achievement: item?.achievement ?? '', avatarColor: item?.avatarColor ?? '#ea580c' })
  const [photo, setPhoto] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof typeof d) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => setD({ ...d, [k]: e.target.value })
  const save = async () => {
    if (!d.name.trim() || !d.role.trim() || d.content.trim().length < 20) {
      toast('Name, role and at least 20 characters of feedback are required.', 'error')
      return
    }
    const form = new FormData()
    Object.entries(d).forEach(([k, v]) => form.set(k, v.trim()))
    form.set('image', d.name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase())
    if (photo) form.set('photo', photo)
    setSaving(true)
    try {
      await adminKit.saveTestimonial(item?.id ?? null, form)
      toast('Testimonial saved.')
      onSaved()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'error')
    } finally {
      setSaving(false)
    }
  }
  return (
    <Modal open onClose={onClose} title={item ? 'Edit testimonial' : 'Add testimonial'} footer={<><Button variant="secondary" onClick={onClose}>Cancel</Button><Button onClick={save} loading={saving}>Save</Button></>}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name">
          <input value={d.name} onChange={set('name')} maxLength={100} className={inputClass} />
        </Field>
        <Field label="Role" hint="e.g. Hiker, HR Manager">
          <input value={d.role} onChange={set('role')} maxLength={100} className={inputClass} />
        </Field>
        <Field label="Company" hint="optional">
          <input value={d.company} onChange={set('company')} maxLength={100} className={inputClass} />
        </Field>
        <Field label="Rating">
          <select value={d.rating} onChange={set('rating')} className={inputClass}>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} star{n === 1 ? '' : 's'}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Feedback" className="sm:col-span-2">
          <textarea rows={4} value={d.content} onChange={set('content')} maxLength={500} className={inputClass} />
        </Field>
        <Field label="Highlight" hint="optional, e.g. 5 hikes completed">
          <input value={d.achievement} onChange={set('achievement')} maxLength={200} className={inputClass} />
        </Field>
        <Field label="Photo" hint="optional">
          <span className="flex items-center gap-2">
            <ImagePlus className="h-5 w-5 text-gray-400" />
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} className="block w-full text-sm text-gray-600" />
          </span>
        </Field>
      </div>
    </Modal>
  )
}

// --- Gallery -----------------------------------------------------------------------

function GalleryPanel() {
  const images = useList('gallery-images', adminKit.galleryImages)
  const categories = useList('gallery-categories', adminKit.galleryCategories)
  const [categoryId, setCategoryId] = useState('')
  const [newAlbum, setNewAlbum] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const selected = categoryId || categories.items[0]?.id || ''

  const upload = async () => {
    if (!files.length) {
      toast('Choose one or more photos first.', 'error')
      return
    }
    setUploading(true)
    try {
      let album = selected
      if (!album || newAlbum.trim()) {
        const created = await adminKit.createGalleryCategory(newAlbum.trim() || 'Adventures')
        album = created.id
        setNewAlbum('')
        categories.load()
      }
      const form = new FormData()
      form.set('categoryId', album)
      files.forEach((f) => form.append('images', f))
      await adminKit.uploadGalleryImages(form)
      toast(`${files.length} photo${files.length === 1 ? '' : 's'} uploaded.`)
      setFiles([])
      images.load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const remove = async (img: GalleryImage) => {
    if (!window.confirm('Delete this photo?')) return
    try {
      await adminKit.deleteGalleryImage(img.id)
      toast('Photo deleted.')
      images.load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete', 'error')
    }
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h3 className="mb-1 font-bold text-gray-900">Upload photos</h3>
        <p className="mb-4 text-sm text-gray-500">Up to 30 at a time (JPG, PNG or WebP, 5 MB each). They appear on the Gallery page straight away.</p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Album">
            <select value={selected} onChange={(e) => setCategoryId(e.target.value)} className={inputClass} disabled={!categories.items.length}>
              {categories.items.length === 0 && <option value="">No albums yet</option>}
              {categories.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.imageCount})
                </option>
              ))}
            </select>
          </Field>
          <Field label="…or new album" hint="optional">
            <input value={newAlbum} onChange={(e) => setNewAlbum(e.target.value)} maxLength={100} className={inputClass} placeholder="e.g. Mt. Kenya 2026" />
          </Field>
          <Field label="Photos">
            <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={(e) => setFiles(Array.from(e.target.files ?? []).slice(0, 30))} className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-accent-50 file:px-3 file:py-2 file:font-semibold file:text-accent-700" />
          </Field>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={upload} loading={uploading}>
            <Upload className="h-4 w-4" /> Upload{files.length ? ` ${files.length}` : ''}
          </Button>
        </div>
      </Card>

      {images.error ? (
        <ErrorState message={images.error} onRetry={images.load} />
      ) : images.loading ? (
        <SkeletonRows rows={2} />
      ) : images.items.length === 0 ? (
        <EmptyState title="No photos yet." text="Until you upload some, the gallery shows a starter set of stock photos." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {images.items.map((img) => (
            <div key={img.id} className="group relative overflow-hidden rounded-xl bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.title ?? ''} loading="lazy" className="aspect-square w-full object-cover" />
              <button onClick={() => remove(img)} className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-red-600 opacity-0 shadow transition-opacity group-hover:opacity-100 focus:opacity-100" aria-label="Delete photo">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
