'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowDown, ArrowUp, EyeOff, ImagePlus, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import { Audience, PricingType, Service, ServicePackage, adminKit, formatMoney } from './api'
import { Badge, Button, Card, EmptyState, ErrorState, Field, ListInput, Modal, PageTitle, SkeletonRows, Toggle, cx, inputClass, toast, useQuery } from './ui'

const AUDIENCES: { value: Audience; label: string }[] = [
  { value: 'individual', label: 'Individuals' },
  { value: 'corporate', label: 'Corporate clients' },
  { value: 'both', label: 'Both' },
]
const PRICING: { value: PricingType; label: string }[] = [
  { value: 'fixed', label: 'Fixed price' },
  { value: 'per_person', label: 'Per person' },
  { value: 'quote', label: 'On quotation' },
]

interface Draft {
  title: string
  description: string
  features: string[]
  price: string
  priceAmount: string
  pricingType: PricingType
  category: string
  audience: Audience
  duration: string
  groupSize: string
  schedule: string
  level: string
  location: string
  minParticipants: string
  maxParticipants: string
  bookingRequirements: string
  imageUrl: string
  icon: string
  color: string
  popular: boolean
  available: boolean
  published: boolean
  order: string
  packages: ServicePackage[]
}

const EMPTY: Draft = {
  title: '', description: '', features: [], price: '', priceAmount: '', pricingType: 'fixed', category: '', audience: 'individual',
  duration: '', groupSize: '', schedule: '', level: '', location: '', minParticipants: '', maxParticipants: '', bookingRequirements: '',
  imageUrl: '', icon: '', color: '', popular: false, available: true, published: true, order: '0', packages: [],
}

const str = (v: number | string | null | undefined) => (v === null || v === undefined ? '' : String(v))

function draftFrom(s: Service): Draft {
  return {
    title: s.title, description: s.description, features: s.features, price: s.price, priceAmount: str(s.priceAmount), pricingType: s.pricingType,
    category: s.category ?? '', audience: s.audience, duration: s.duration ?? '', groupSize: s.groupSize ?? '', schedule: s.schedule ?? '',
    level: s.level ?? '', location: s.location ?? '', minParticipants: str(s.minParticipants), maxParticipants: str(s.maxParticipants),
    bookingRequirements: s.bookingRequirements ?? '', imageUrl: s.image.startsWith('/api/') ? '' : s.image, icon: s.icon ?? '', color: s.color ?? '',
    popular: s.popular, available: s.available, published: s.published, order: String(s.order), packages: s.packages,
  }
}

function autoPriceLabel(d: Draft) {
  if (d.pricingType === 'quote' || !d.priceAmount) return 'Price on quotation'
  const amount = formatMoney(Number(d.priceAmount))
  return d.pricingType === 'per_person' ? `${amount} per person` : amount
}

/**
 * Catalogue of bookable services: gym programmes, corporate packages,
 * outdoor activities and classes. Categories are free text, so a new kind
 * of offering is just a new category — no code change.
 */
export default function ServicesView({ showStyleFields = false, categoryHints = [] }: { showStyleFields?: boolean; categoryHints?: string[] }) {
  const { data, loading, error, reload: load } = useQuery('services', adminKit.services)
  const [query, setQuery] = useState('')
  const [audience, setAudience] = useState<Audience | ''>('')
  const [category, setCategory] = useState('')
  const [editing, setEditing] = useState<Service | 'new' | null>(null)

  const items = useMemo(() => data ?? [], [data])
  const categories = useMemo(
    () => Array.from(new Set([...categoryHints, ...items.map((i) => i.category).filter(Boolean) as string[]])).sort(),
    [items, categoryHints]
  )
  const q = query.trim().toLowerCase()
  const visible = items.filter(
    (s) =>
      (!audience || s.audience === audience || (audience !== 'both' && s.audience === 'both')) &&
      (!category || s.category === category) &&
      (!q || [s.title, s.category ?? '', s.description].some((v) => v.toLowerCase().includes(q)))
  )

  const remove = async (s: Service) => {
    if (!window.confirm(`Delete “${s.title}”? Existing enquiries keep their record, but the service disappears from the website.`)) return
    try {
      await adminKit.deleteService(s.id)
      toast('Service deleted.')
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not delete', 'error')
    }
  }

  const quickToggle = async (s: Service, field: 'published' | 'available') => {
    const form = new FormData()
    form.set(field, String(!s[field]))
    try {
      await adminKit.saveService(s.id, form)
      toast(`${s.title}: ${field === 'published' ? (s.published ? 'hidden' : 'published') : s.available ? 'marked unavailable' : 'available again'}.`)
      load()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not update', 'error')
    }
  }

  return (
    <div>
      <PageTitle
        title="Services & packages"
        subtitle="Everything customers can book — individual and corporate."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> New service
          </Button>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search services…" className={`${inputClass} pl-9`} aria-label="Search services" />
        </div>
        <select value={audience} onChange={(e) => setAudience(e.target.value as Audience | '')} className={inputClass} aria-label="Audience">
          <option value="">All audiences</option>
          {AUDIENCES.map((a) => (
            <option key={a.value} value={a.value}>
              {a.label}
            </option>
          ))}
        </select>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </div>

      {error ? (
        <ErrorState message={error} onRetry={load} />
      ) : loading && !data ? (
        <SkeletonRows />
      ) : visible.length === 0 ? (
        <EmptyState title={items.length ? 'No services match.' : 'No services yet.'} action={<Button onClick={() => setEditing('new')}>Add your first service</Button>} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((s) => (
            <Card key={s.id} className={cx('flex flex-col overflow-hidden', !s.published && 'opacity-70')}>
              <div className="relative h-36 bg-gray-100">
                {s.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.image} alt="" className="h-full w-full object-cover object-[50%_25%]" loading="lazy" />
                )}
                <div className="absolute left-3 top-3 flex flex-wrap gap-1">
                  {s.category && <span className="rounded-full bg-white/90 px-2.5 py-0.5 text-xs font-semibold text-gray-800">{s.category}</span>}
                  {s.audience !== 'individual' && <Badge value="corporate" label={s.audience === 'both' ? 'all clients' : 'corporate'} />}
                </div>
                <div className="absolute right-3 top-3 flex gap-1">
                  {s.popular && <Star className="h-5 w-5 fill-amber-400 text-amber-400" />}
                  {!s.published && <span className="rounded-full bg-gray-900/80 px-2 py-0.5 text-xs font-semibold text-white">Hidden</span>}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h3 className="font-bold text-gray-900">{s.title}</h3>
                <p className="mb-2 text-sm text-gray-500">
                  {s.price}
                  {s.packages.length > 0 && ` · ${s.packages.length} package${s.packages.length === 1 ? '' : 's'}`}
                </p>
                <p className="mb-4 line-clamp-2 text-sm text-gray-600">{s.description}</p>
                {!s.available && <p className="mb-3 text-xs font-semibold text-amber-700">Not taking bookings</p>}
                <div className="mt-auto flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditing(s)}>
                    <Pencil className="h-4 w-4" /> Edit
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => quickToggle(s, 'published')}>
                    <EyeOff className="h-4 w-4" /> {s.published ? 'Hide' : 'Publish'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => quickToggle(s, 'available')}>
                    {s.available ? 'Pause bookings' : 'Resume bookings'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(s)} aria-label={`Delete ${s.title}`} className="text-red-600 hover:bg-red-50">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {editing && (
        <ServiceEditor
          service={editing === 'new' ? null : editing}
          categories={categories}
          showStyleFields={showStyleFields}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </div>
  )
}

function ServiceEditor({ service, categories, showStyleFields, onClose, onSaved }: { service: Service | null; categories: string[]; showStyleFields: boolean; onClose: () => void; onSaved: () => void }) {
  const [d, setD] = useState<Draft>(service ? draftFrom(service) : EMPTY)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState(service?.image ?? '')
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }))
  const text = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => set(k, e.target.value as never)

  useEffect(() => {
    if (!file) return
    const url = URL.createObjectURL(file)
     
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!d.title.trim()) e.title = 'Required'
    if (!d.description.trim()) e.description = 'Required'
    if (d.features.length === 0) e.features = 'Add at least one feature'
    if (d.pricingType !== 'quote' && d.priceAmount && Number(d.priceAmount) < 0) e.priceAmount = 'Must be 0 or more'
    if (d.minParticipants && d.maxParticipants && Number(d.minParticipants) > Number(d.maxParticipants)) e.maxParticipants = 'Must be ≥ minimum'
    d.packages.forEach((p, i) => {
      if (!p.name.trim()) e[`pkg${i}`] = 'Package name is required'
    })
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const save = async () => {
    if (!validate()) {
      toast('Please fix the highlighted fields.', 'error')
      return
    }
    const form = new FormData()
    const fields: Record<string, string> = {
      title: d.title.trim(),
      description: d.description.trim(),
      features: JSON.stringify(d.features),
      price: d.price.trim() || autoPriceLabel(d),
      priceAmount: d.pricingType === 'quote' ? '' : d.priceAmount,
      pricingType: d.pricingType,
      category: d.category.trim(),
      audience: d.audience,
      duration: d.duration,
      groupSize: d.groupSize,
      schedule: d.schedule,
      level: d.level,
      location: d.location,
      minParticipants: d.minParticipants,
      maxParticipants: d.maxParticipants,
      bookingRequirements: d.bookingRequirements,
      popular: String(d.popular),
      available: String(d.available),
      published: String(d.published),
      order: d.order || '0',
      packages: JSON.stringify(
        d.packages.map((p, i) => ({
          ...p,
          name: p.name.trim(),
          priceAmount: p.pricingType === 'quote' || p.priceAmount === null ? null : Number(p.priceAmount),
          order: i,
        }))
      ),
    }
    if (showStyleFields) {
      fields.icon = d.icon
      fields.color = d.color
    }
    Object.entries(fields).forEach(([k, v]) => form.set(k, v))
    if (file) form.set('image', file)
    else if (d.imageUrl) form.set('imageUrl', d.imageUrl)
    setSaving(true)
    try {
      await adminKit.saveService(service?.id ?? null, form)
      toast(service ? 'Service updated.' : 'Service created.')
      onSaved()
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save', 'error')
    } finally {
      setSaving(false)
    }
  }

  const updatePkg = (i: number, patch: Partial<ServicePackage>) => set('packages', d.packages.map((p, j) => (j === i ? { ...p, ...patch } : p)))
  const movePkg = (i: number, dir: -1 | 1) => {
    const next = [...d.packages]
    const j = i + dir
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    set('packages', next)
  }

  return (
    <Modal
      open
      wide
      onClose={onClose}
      title={service ? `Edit ${service.title}` : 'New service'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} loading={saving}>
            {service ? 'Save changes' : 'Create service'}
          </Button>
        </>
      }
    >
      <div className="space-y-8">
        <section className="grid gap-4 sm:grid-cols-2">
          <Field label="Title" error={errors.title} className="sm:col-span-2">
            <input value={d.title} onChange={text('title')} maxLength={200} className={inputClass} />
          </Field>
          <Field label="Description" error={errors.description} className="sm:col-span-2">
            <textarea rows={3} value={d.description} onChange={text('description')} maxLength={5000} className={inputClass} />
          </Field>
          <Field label="Category" hint="type a new one to create it">
            <input list="svc-categories" value={d.category} onChange={text('category')} maxLength={60} className={inputClass} placeholder="e.g. Team Building" />
            <datalist id="svc-categories">
              {categories.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </Field>
          <Field label="Who is it for?">
            <select value={d.audience} onChange={text('audience')} className={inputClass}>
              {AUDIENCES.map((a) => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="What’s included" error={errors.features} className="sm:col-span-2">
            <ListInput value={d.features} onChange={(v) => set('features', v)} placeholder="e.g. Certified trainer" />
          </Field>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Pricing</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Pricing">
              <select value={d.pricingType} onChange={text('pricingType')} className={inputClass}>
                {PRICING.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Amount (USD)" error={errors.priceAmount} hint={d.pricingType === 'quote' ? 'not used' : undefined}>
              <input type="number" min={0} value={d.priceAmount} onChange={text('priceAmount')} disabled={d.pricingType === 'quote'} className={inputClass} />
            </Field>
            <Field label="Price label" hint="shown on the site">
              <input value={d.price} onChange={text('price')} maxLength={100} className={inputClass} placeholder={autoPriceLabel(d)} />
            </Field>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500">Details & booking</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Duration">
              <input value={d.duration} onChange={text('duration')} maxLength={60} className={inputClass} placeholder="Half day" />
            </Field>
            <Field label="Group size">
              <input value={d.groupSize} onChange={text('groupSize')} maxLength={60} className={inputClass} placeholder="10–50 people" />
            </Field>
            <Field label="Level">
              <input value={d.level} onChange={text('level')} maxLength={40} className={inputClass} placeholder="All levels" />
            </Field>
            <Field label="Schedule">
              <input value={d.schedule} onChange={text('schedule')} maxLength={120} className={inputClass} placeholder="Mon, Wed | 6 AM" />
            </Field>
            <Field label="Location">
              <input value={d.location} onChange={text('location')} maxLength={160} className={inputClass} placeholder="Your office or our gym" />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Min people">
                <input type="number" min={1} value={d.minParticipants} onChange={text('minParticipants')} className={inputClass} />
              </Field>
              <Field label="Max people" error={errors.maxParticipants}>
                <input type="number" min={1} value={d.maxParticipants} onChange={text('maxParticipants')} className={inputClass} />
              </Field>
            </div>
            <Field label="What we need from the customer" hint="shown in the booking form" className="sm:col-span-3">
              <textarea rows={2} value={d.bookingRequirements} onChange={text('bookingRequirements')} maxLength={2000} className={inputClass} placeholder="Preferred date, number of participants, venue…" />
            </Field>
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">Packages</h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={() =>
                set('packages', [
                  ...d.packages,
                  { name: '', description: null, priceAmount: null, pricingType: 'quote', priceLabel: null, minParticipants: null, maxParticipants: null, features: [], popular: false, order: d.packages.length, active: true },
                ])
              }
            >
              <Plus className="h-4 w-4" /> Add package
            </Button>
          </div>
          {d.packages.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">Optional. Add tiers (e.g. Starter / Team / Enterprise) when one price doesn’t fit every group.</p>
          ) : (
            <div className="space-y-3">
              {d.packages.map((p, i) => (
                <div key={p.id ?? `new-${i}`} className="rounded-xl border border-gray-200 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-semibold text-gray-700">Package {i + 1}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => movePkg(i, -1)} disabled={i === 0} aria-label="Move up">
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => movePkg(i, 1)} disabled={i === d.packages.length - 1} aria-label="Move down">
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => set('packages', d.packages.filter((_, j) => j !== i))} aria-label="Remove package">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-4">
                    <Field label="Name" error={errors[`pkg${i}`]} className="sm:col-span-2">
                      <input value={p.name} onChange={(e) => updatePkg(i, { name: e.target.value })} maxLength={120} className={inputClass} />
                    </Field>
                    <Field label="Pricing">
                      <select value={p.pricingType} onChange={(e) => updatePkg(i, { pricingType: e.target.value as PricingType })} className={inputClass}>
                        {PRICING.map((x) => (
                          <option key={x.value} value={x.value}>
                            {x.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Amount (USD)">
                      <input
                        type="number"
                        min={0}
                        value={p.priceAmount ?? ''}
                        disabled={p.pricingType === 'quote'}
                        onChange={(e) => updatePkg(i, { priceAmount: e.target.value === '' ? null : Number(e.target.value) })}
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Description" className="sm:col-span-2">
                      <input value={p.description ?? ''} onChange={(e) => updatePkg(i, { description: e.target.value || null })} maxLength={2000} className={inputClass} />
                    </Field>
                    <Field label="Price label" hint="optional">
                      <input value={p.priceLabel ?? ''} onChange={(e) => updatePkg(i, { priceLabel: e.target.value || null })} maxLength={100} className={inputClass} />
                    </Field>
                    <div className="grid grid-cols-2 gap-2">
                      <Field label="Min">
                        <input type="number" min={1} value={p.minParticipants ?? ''} onChange={(e) => updatePkg(i, { minParticipants: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
                      </Field>
                      <Field label="Max">
                        <input type="number" min={1} value={p.maxParticipants ?? ''} onChange={(e) => updatePkg(i, { maxParticipants: e.target.value ? Number(e.target.value) : null })} className={inputClass} />
                      </Field>
                    </div>
                    <Field label="Includes" className="sm:col-span-4">
                      <ListInput value={p.features} onChange={(v) => updatePkg(i, { features: v })} placeholder="e.g. Transport included" />
                    </Field>
                    <div className="flex flex-wrap gap-6 sm:col-span-4">
                      <Toggle checked={p.popular} onChange={(v) => updatePkg(i, { popular: v })} label="Highlight as popular" />
                      <Toggle checked={p.active} onChange={(v) => updatePkg(i, { active: v })} label="Offered" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-[160px_1fr]">
          <div className="flex h-32 items-center justify-center overflow-hidden rounded-xl bg-gray-100">
            {preview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-full w-full object-cover object-[50%_25%]" />
            ) : (
              <ImagePlus className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <div className="space-y-3">
            <Field label="Upload image" hint="JPG, PNG or WebP, up to 5 MB">
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-accent-50 file:px-3 file:py-2 file:font-semibold file:text-accent-700" />
            </Field>
            <Field label="…or image URL">
              <input
                value={d.imageUrl}
                onChange={(e) => {
                  set('imageUrl', e.target.value)
                  if (!file) setPreview(e.target.value)
                }}
                placeholder="https://… or /images/…"
                className={inputClass}
              />
            </Field>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Toggle checked={d.published} onChange={(v) => set('published', v)} label="Published" hint="Visible on the website" />
          <Toggle checked={d.available} onChange={(v) => set('available', v)} label="Taking bookings" hint="Turn off to show it as unavailable" />
          <Toggle checked={d.popular} onChange={(v) => set('popular', v)} label="Popular" hint="Highlighted on the website" />
          <Field label="Display order" hint="lower comes first">
            <input type="number" value={d.order} onChange={text('order')} className={inputClass} />
          </Field>
          {showStyleFields && (
            <>
              <Field label="Icon" hint="lucide name, e.g. Dumbbell">
                <input value={d.icon} onChange={text('icon')} maxLength={100} className={inputClass} />
              </Field>
              <Field label="Card colour" hint="Tailwind gradient classes">
                <input value={d.color} onChange={text('color')} maxLength={50} className={inputClass} placeholder="from-[#007AA9] to-[#31A8F0]" />
              </Field>
            </>
          )}
        </section>
      </div>
    </Modal>
  )
}
