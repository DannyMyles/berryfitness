'use client'

import { useEffect, useState } from 'react'
import { ArrowDown, ArrowUp, CheckCircle2, Mail, Plus, Send, Trash2 } from 'lucide-react'
import { AppSettings, SiteSettings, TitledText, adminKit } from './api'
import { Button, Card, ErrorState, Field, ListInput, PageTitle, SkeletonRows, cx, inputClass, toast } from './ui'

type Section = 'business' | 'home' | 'pages' | 'about' | 'corporate' | 'booking' | 'email'

/** An inner page whose banner copy can be edited. */
export interface EditablePage {
  key: string
  label: string
  /** The page shows a second, coloured line after the title. */
  highlight?: boolean
  /** The page banner has a photo. */
  image?: boolean
}

/**
 * Business details and page copy for this app. Everything here is public
 * website content except the alert email; saving merges section by section.
 */
export default function SettingsView({ showCorporate = false, pages = [] }: { showCorporate?: boolean; pages?: EditablePage[] }) {
  const [data, setData] = useState<AppSettings | null>(null)
  const [s, setS] = useState<SiteSettings>({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [section, setSection] = useState<Section>('business')
  const [testTo, setTestTo] = useState('')
  const [testing, setTesting] = useState(false)

  const load = () => {
    setError('')
    adminKit
      .settings()
      .then((r) => {
        setData(r)
        setS(r.settings ?? {})
      })
      .catch((e) => setError(e.message))
  }
  useEffect(load, [])

  if (error) return <ErrorState message={error} onRetry={load} />
  if (!data) return <SkeletonRows rows={3} />

  const setField = (k: keyof AppSettings) => (e: React.ChangeEvent<HTMLInputElement>) => setData({ ...data, [k]: e.target.value })
  const patch = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS((x) => ({ ...x, [k]: v }))
  const sub = <K extends 'hero' | 'about' | 'corporate' | 'booking' | 'email' | 'brand' | 'social' | 'seo'>(k: K, field: string) => ({
    value: ((s[k] as Record<string, unknown> | undefined)?.[field] as string | undefined) ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => patch(k, { ...(s[k] as object), [field]: e.target.value } as SiteSettings[K]),
  })

  const save = async () => {
    setSaving(true)
    try {
      const clean = JSON.parse(JSON.stringify(s), (_k, v) => (typeof v === 'string' ? v.trim() : v)) as SiteSettings
      const r = await adminKit.saveSettings({
        name: data.name.trim(),
        tagline: data.tagline,
        contactPhone: data.contactPhone,
        contactEmail: data.contactEmail,
        whatsappNumber: data.whatsappNumber,
        location: data.location,
        notificationEmail: data.notificationEmail,
        frontendUrl: data.frontendUrl,
        settings: clean,
      })
      setData({ ...data, ...r })
      setS(r.settings)
      toast('Settings saved — the website updates within a minute.')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Could not save settings', 'error')
    } finally {
      setSaving(false)
    }
  }

  const sendTest = async () => {
    if (!/^\S+@\S+\.\S+$/.test(testTo)) {
      toast('Enter an email address to send the test to.', 'error')
      return
    }
    setTesting(true)
    try {
      const r = await adminKit.testEmail(testTo)
      toast(r.message)
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Test email failed', 'error')
    } finally {
      setTesting(false)
    }
  }

  const sections: { value: Section; label: string }[] = [
    { value: 'business', label: 'Business' },
    { value: 'home', label: 'Homepage' },
    ...(pages.length ? [{ value: 'pages' as Section, label: 'Page headers' }] : []),
    { value: 'about', label: 'About & team' },
    ...(showCorporate ? [{ value: 'corporate' as Section, label: 'Corporate' }] : []),
    { value: 'booking', label: 'Booking' },
    { value: 'email', label: 'Email & brand' },
  ]

  return (
    <div className="pb-24">
      <PageTitle title="Settings" subtitle="Business details and website content." />
      <div role="tablist" className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-gray-100 p-1">
        {sections.map((t) => (
          <button
            key={t.value}
            role="tab"
            aria-selected={section === t.value}
            onClick={() => setSection(t.value)}
            className={cx('whitespace-nowrap rounded-lg px-4 py-2 text-sm font-semibold transition-colors', section === t.value ? 'bg-white text-accent-700 shadow-sm' : 'text-gray-600 hover:text-gray-900')}
          >
            {t.label}
          </button>
        ))}
      </div>

      {section === 'business' && (
        <div className="space-y-6">
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <Field label="Business name">
              <input value={data.name} onChange={setField('name')} maxLength={120} className={inputClass} />
            </Field>
            <Field label="Tagline">
              <input value={data.tagline ?? ''} onChange={setField('tagline')} maxLength={255} className={inputClass} />
            </Field>
            <Field label="Phone">
              <input value={data.contactPhone ?? ''} onChange={setField('contactPhone')} maxLength={40} className={inputClass} placeholder="+254 7…" />
            </Field>
            <Field label="WhatsApp number" hint="bookings open a chat here">
              <input value={data.whatsappNumber ?? ''} onChange={setField('whatsappNumber')} maxLength={20} className={inputClass} placeholder="0712 345 678" />
            </Field>
            <Field label="Public email">
              <input type="email" value={data.contactEmail ?? ''} onChange={setField('contactEmail')} className={inputClass} />
            </Field>
            <Field label="Second email" hint="optional, e.g. bookings@">
              <input type="email" value={s.secondaryEmail ?? ''} onChange={(e) => patch('secondaryEmail', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Location">
              <input value={data.location ?? ''} onChange={setField('location')} maxLength={200} className={inputClass} />
            </Field>
            <Field label="Postal address" hint="optional, e.g. P.O. Box">
              <input value={s.postalAddress ?? ''} onChange={(e) => patch('postalAddress', e.target.value)} maxLength={200} className={inputClass} />
            </Field>
            <Field label="Opening hours">
              <input value={s.hours ?? ''} onChange={(e) => patch('hours', e.target.value)} maxLength={120} className={inputClass} placeholder="Mon–Sat, 6am – 8pm" />
            </Field>
            <Field label="Map link" hint="optional Google Maps URL">
              <input value={s.mapUrl ?? ''} onChange={(e) => patch('mapUrl', e.target.value)} className={inputClass} />
            </Field>
            <Field label="Website address" hint="used for links in emails">
              <input value={data.frontendUrl ?? ''} onChange={setField('frontendUrl')} className={inputClass} placeholder="https://…" />
            </Field>
          </Card>
          <Card className="p-5">
            <h3 className="mb-4 font-bold text-gray-900">Social media</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {(['instagram', 'facebook', 'tiktok', 'youtube', 'x', 'linkedin'] as const).map((k) => (
                <Field key={k} label={k === 'x' ? 'X (Twitter)' : k[0].toUpperCase() + k.slice(1)}>
                  <input {...sub('social', k)} className={inputClass} placeholder="https://…" />
                </Field>
              ))}
            </div>
          </Card>
          <Card className="p-5">
            <Field label="Search engine description" hint="shown in Google results">
              <textarea rows={2} maxLength={300} {...sub('seo', 'description')} className={inputClass} />
            </Field>
          </Card>
        </div>
      )}

      {section === 'home' && (
        <div className="space-y-6">
          <Card className="grid gap-4 p-5 sm:grid-cols-2">
            <h3 className="font-bold text-gray-900 sm:col-span-2">Hero banner</h3>
            <Field label="Small label above the title" className="sm:col-span-2">
              <input maxLength={120} {...sub('hero', 'eyebrow')} className={inputClass} />
            </Field>
            <Field label="Title">
              <input maxLength={120} {...sub('hero', 'title')} className={inputClass} />
            </Field>
            <Field label="Highlighted line">
              <input maxLength={120} {...sub('hero', 'highlight')} className={inputClass} />
            </Field>
            <Field label="Intro text" className="sm:col-span-2">
              <textarea rows={3} maxLength={600} {...sub('hero', 'subtitle')} className={inputClass} />
            </Field>
            <Field label="Main button label">
              <input maxLength={40} {...sub('hero', 'primaryCtaLabel')} className={inputClass} />
            </Field>
            <Field label="Main button link">
              <input {...sub('hero', 'primaryCtaUrl')} className={inputClass} placeholder="/services" />
            </Field>
            <Field label="Second button label">
              <input maxLength={40} {...sub('hero', 'secondaryCtaLabel')} className={inputClass} />
            </Field>
            <Field label="Second button link" hint="blank = WhatsApp">
              <input {...sub('hero', 'secondaryCtaUrl')} className={inputClass} />
            </Field>
            <Field label="Hero image" hint="/image.jpg or https://…" className="sm:col-span-2">
              <input {...sub('hero', 'imageUrl')} className={inputClass} />
            </Field>
            <Field label="Short selling points" className="sm:col-span-2">
              <ListInput value={s.hero?.perks ?? []} onChange={(v) => patch('hero', { ...s.hero, perks: v })} max={6} placeholder="e.g. Groups welcome" />
            </Field>
          </Card>
          <TitledListEditor title="How it works (steps)" items={s.steps ?? []} onChange={(v) => patch('steps', v)} max={6} />
          <TitledListEditor title="Highlights / benefits" items={s.highlights ?? []} onChange={(v) => patch('highlights', v)} max={9} />
          <StatsEditor items={s.stats ?? []} onChange={(v) => patch('stats', v)} />
        </div>
      )}

      {section === 'pages' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">The banner at the top of each page. Leave a field empty to keep the built-in wording.</p>
          {pages.map((pg) => {
            const value = s.pages?.[pg.key] ?? {}
            const setPage = (field: string, v: string) => patch('pages', { ...s.pages, [pg.key]: { ...value, [field]: v } })
            return (
              <Card key={pg.key} className="grid gap-4 p-5 sm:grid-cols-2">
                <h3 className="font-bold text-gray-900 sm:col-span-2">{pg.label}</h3>
                <Field label="Small label">
                  <input value={value.eyebrow ?? ''} onChange={(e) => setPage('eyebrow', e.target.value)} maxLength={80} className={inputClass} />
                </Field>
                <Field label="Title">
                  <input value={value.title ?? ''} onChange={(e) => setPage('title', e.target.value)} maxLength={120} className={inputClass} />
                </Field>
                {pg.highlight && (
                  <Field label="Highlighted words" hint="shown in colour after the title">
                    <input value={value.highlight ?? ''} onChange={(e) => setPage('highlight', e.target.value)} maxLength={80} className={inputClass} />
                  </Field>
                )}
                {pg.image && (
                  <Field label="Banner image" hint="/image.jpg or https://…">
                    <input value={value.imageUrl ?? ''} onChange={(e) => setPage('imageUrl', e.target.value)} className={inputClass} />
                  </Field>
                )}
                <Field label="Intro text" className="sm:col-span-2">
                  <textarea rows={2} value={value.subtitle ?? ''} onChange={(e) => setPage('subtitle', e.target.value)} maxLength={400} className={inputClass} />
                </Field>
              </Card>
            )
          })}
        </div>
      )}

      {section === 'about' && (
        <div className="space-y-6">
          <Card className="grid gap-4 p-5">
            <Field label="Headline">
              <input maxLength={160} {...sub('about', 'headline')} className={inputClass} />
            </Field>
            <Field label="Introduction">
              <textarea rows={4} maxLength={4000} {...sub('about', 'body')} className={inputClass} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Mission">
                <textarea rows={3} maxLength={1000} {...sub('about', 'mission')} className={inputClass} />
              </Field>
              <Field label="Vision">
                <textarea rows={3} maxLength={1000} {...sub('about', 'vision')} className={inputClass} />
              </Field>
            </div>
            <Field label="Our story" hint="separate paragraphs with a blank line">
              <textarea rows={7} maxLength={6000} {...sub('about', 'story')} className={inputClass} />
            </Field>
            <Field label="Banner image" hint="/image.jpg or https://…">
              <input {...sub('about', 'imageUrl')} className={inputClass} />
            </Field>
          </Card>
          <TitledListEditor title="Values" items={s.values ?? []} onChange={(v) => patch('values', v)} max={9} />
          <TeamEditor items={s.team ?? []} onChange={(v) => patch('team', v)} />
        </div>
      )}

      {section === 'corporate' && (
        <Card className="grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Headline" className="sm:col-span-2">
            <input maxLength={160} {...sub('corporate', 'headline')} className={inputClass} />
          </Field>
          <Field label="Introduction" className="sm:col-span-2">
            <textarea rows={3} maxLength={600} {...sub('corporate', 'subtitle')} className={inputClass} />
          </Field>
          <Field label="Image" hint="/image.jpg or https://…">
            <input {...sub('corporate', 'imageUrl')} className={inputClass} />
          </Field>
          <Field label="Always quote from this many people" hint="larger groups skip fixed prices">
            <input
              type="number"
              min={1}
              value={s.corporate?.minGroupForQuote ?? ''}
              onChange={(e) => patch('corporate', { ...s.corporate, minGroupForQuote: e.target.value ? Number(e.target.value) : undefined })}
              className={inputClass}
            />
          </Field>
        </Card>
      )}

      {section === 'booking' && (
        <Card className="grid gap-4 p-5">
          <Field label="WhatsApp notice" hint="shown wherever customers are sent to WhatsApp">
            <textarea rows={2} maxLength={300} {...sub('booking', 'whatsappNotice')} className={inputClass} />
          </Field>
          <Field label="Success message" hint="after a request is sent">
            <textarea rows={2} maxLength={300} {...sub('booking', 'successMessage')} className={inputClass} />
          </Field>
        </Card>
      )}

      {section === 'email' && (
        <div className="space-y-6">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              {data.emailConfigured ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Email sending is configured
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800">
                  <Mail className="h-4 w-4" /> Email isn’t configured on the server yet (SMTP settings)
                </span>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Send booking & enquiry alerts to" hint="defaults to the public email">
                <input type="email" value={data.notificationEmail ?? ''} onChange={setField('notificationEmail')} className={inputClass} />
              </Field>
              <Field label="Email sign-off">
                <input maxLength={120} {...sub('email', 'signature')} className={inputClass} placeholder={`The ${data.name} team`} />
              </Field>
              <Field label="Footer note" className="sm:col-span-2">
                <input maxLength={300} {...sub('email', 'footerNote')} className={inputClass} />
              </Field>
              <Field label="Primary colour">
                <span className="flex gap-2">
                  <input type="color" value={s.brand?.primaryColor || '#ea580c'} onChange={(e) => patch('brand', { ...s.brand, primaryColor: e.target.value })} className="h-11 w-14 rounded-lg border border-gray-200" aria-label="Primary colour picker" />
                  <input {...sub('brand', 'primaryColor')} className={inputClass} placeholder="#EA580C" />
                </span>
              </Field>
              <Field label="Accent colour">
                <span className="flex gap-2">
                  <input type="color" value={s.brand?.secondaryColor || '#059669'} onChange={(e) => patch('brand', { ...s.brand, secondaryColor: e.target.value })} className="h-11 w-14 rounded-lg border border-gray-200" aria-label="Accent colour picker" />
                  <input {...sub('brand', 'secondaryColor')} className={inputClass} placeholder="#059669" />
                </span>
              </Field>
            </div>
          </Card>
          <Card className="p-5">
            <h3 className="mb-1 font-bold text-gray-900">Send a test email</h3>
            <p className="mb-4 text-sm text-gray-500">Checks the server’s email setup using the saved branding (save first if you changed it).</p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <input type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="you@example.com" className={inputClass} aria-label="Test email recipient" />
              <Button variant="dark" onClick={sendTest} loading={testing}>
                <Send className="h-4 w-4" /> Send test
              </Button>
            </div>
          </Card>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-3 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-6xl justify-end">
          <Button onClick={save} loading={saving}>
            Save settings
          </Button>
        </div>
      </div>
    </div>
  )
}

function Reorder({ i, n, move, remove }: { i: number; n: number; move: (i: number, d: -1 | 1) => void; remove: (i: number) => void }) {
  return (
    <div className="flex gap-1">
      <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === n - 1} aria-label="Move down">
        <ArrowDown className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => remove(i)} aria-label="Remove">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  )
}

function useListOps<T>(items: T[], onChange: (v: T[]) => void) {
  return {
    update: (i: number, patch: Partial<T>) => onChange(items.map((x, j) => (j === i ? { ...x, ...patch } : x))),
    remove: (i: number) => onChange(items.filter((_, j) => j !== i)),
    move: (i: number, d: -1 | 1) => {
      const j = i + d
      if (j < 0 || j >= items.length) return
      const next = [...items]
      ;[next[i], next[j]] = [next[j], next[i]]
      onChange(next)
    },
  }
}

function TitledListEditor({ title, items, onChange, max }: { title: string; items: TitledText[]; onChange: (v: TitledText[]) => void; max: number }) {
  const ops = useListOps(items, onChange)
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">{title}</h3>
        <Button size="sm" variant="secondary" disabled={items.length >= max} onClick={() => onChange([...items, { title: '', text: '' }])}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      {items.length === 0 && <p className="text-sm text-gray-500">Nothing yet.</p>}
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="grid gap-2 rounded-xl border border-gray-100 p-3 sm:grid-cols-[1fr_2fr_auto]">
            <input value={it.title} onChange={(e) => ops.update(i, { title: e.target.value })} maxLength={80} placeholder="Title" className={inputClass} aria-label="Title" />
            <input value={it.text} onChange={(e) => ops.update(i, { text: e.target.value })} maxLength={400} placeholder="Text" className={inputClass} aria-label="Text" />
            <Reorder i={i} n={items.length} move={ops.move} remove={ops.remove} />
          </div>
        ))}
      </div>
    </Card>
  )
}

function StatsEditor({ items, onChange }: { items: { value: string; label: string }[]; onChange: (v: { value: string; label: string }[]) => void }) {
  const ops = useListOps(items, onChange)
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Key numbers</h3>
        <Button size="sm" variant="secondary" disabled={items.length >= 8} onClick={() => onChange([...items, { value: '', label: '' }])}>
          <Plus className="h-4 w-4" /> Add
        </Button>
      </div>
      {items.length === 0 && <p className="text-sm text-gray-500">e.g. “500+” · “Happy clients”. Only add numbers you can stand behind.</p>}
      <div className="space-y-3">
        {items.map((it, i) => (
          <div key={i} className="grid gap-2 sm:grid-cols-[120px_1fr_auto]">
            <input value={it.value} onChange={(e) => ops.update(i, { value: e.target.value })} maxLength={20} placeholder="100+" className={inputClass} aria-label="Value" />
            <input value={it.label} onChange={(e) => ops.update(i, { label: e.target.value })} maxLength={60} placeholder="Clients" className={inputClass} aria-label="Label" />
            <Reorder i={i} n={items.length} move={ops.move} remove={ops.remove} />
          </div>
        ))}
      </div>
    </Card>
  )
}

type Member = NonNullable<SiteSettings['team']>[number]

function TeamEditor({ items, onChange }: { items: Member[]; onChange: (v: Member[]) => void }) {
  const ops = useListOps(items, onChange)
  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">Team</h3>
        <Button size="sm" variant="secondary" disabled={items.length >= 12} onClick={() => onChange([...items, { name: '', role: '', bio: '', imageUrl: '', expertise: [] }])}>
          <Plus className="h-4 w-4" /> Add member
        </Button>
      </div>
      {items.length === 0 && <p className="text-sm text-gray-500">No team members listed.</p>}
      <div className="space-y-4">
        {items.map((m, i) => (
          <div key={i} className="rounded-xl border border-gray-100 p-4">
            <div className="mb-3 flex justify-end">
              <Reorder i={i} n={items.length} move={ops.move} remove={ops.remove} />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Name">
                <input value={m.name} onChange={(e) => ops.update(i, { name: e.target.value })} maxLength={80} className={inputClass} />
              </Field>
              <Field label="Role">
                <input value={m.role} onChange={(e) => ops.update(i, { role: e.target.value })} maxLength={80} className={inputClass} />
              </Field>
              <Field label="Bio" className="sm:col-span-2">
                <textarea rows={3} value={m.bio} onChange={(e) => ops.update(i, { bio: e.target.value })} maxLength={600} className={inputClass} />
              </Field>
              <Field label="Photo" hint="/photo.jpg or https://…">
                <input value={m.imageUrl ?? ''} onChange={(e) => ops.update(i, { imageUrl: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Specialities">
                <ListInput value={m.expertise ?? []} onChange={(v) => ops.update(i, { expertise: v })} max={8} placeholder="e.g. Yoga" />
              </Field>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
