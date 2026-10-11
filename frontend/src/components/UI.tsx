import type { ReactNode } from 'react'
import { LoaderCircle } from 'lucide-react'

export function PageTitle({ eyebrow, title, subtitle, action }: { eyebrow: string; title: string; subtitle: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
    <div><p className="eyebrow">{eyebrow}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight text-white">{title}</h1><p className="mt-2 max-w-2xl text-sm text-muted">{subtitle}</p></div>
    {action}
  </div>
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}>{children}</section>
}

export function Feedback({ tone = 'error', children }: { tone?: 'error' | 'success' | 'info'; children: ReactNode }) {
  return <div role={tone === 'error' ? 'alert' : 'status'} className={`feedback feedback-${tone}`}>{children}</div>
}

export function Loading({ label = 'Loading your data…' }: { label?: string }) {
  return <div className="flex min-h-48 items-center justify-center gap-3 text-sm text-muted"><LoaderCircle className="animate-spin text-aqua" size={18} />{label}</div>
}

export function EmptyState({ title, children }: { title: string; children: ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-line px-5 py-10 text-center"><p className="font-medium text-white">{title}</p><p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">{children}</p></div>
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}
