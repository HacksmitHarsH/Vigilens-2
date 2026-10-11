import { useEffect, useState, type FormEvent } from 'react'
import { Activity, Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { apiRequest } from '../api/client'
import { Card, EmptyState, Feedback, Field, Loading, PageTitle } from '../components/UI'
import type { WellnessLog } from '../types'

type FormValues = { log_date: string; steps: string; resting_heart_rate: string; sleep_duration_hours: string; sleep_quality: string; note: string }
const today = () => new Date().toLocaleDateString('en-CA')
const blankForm = (): FormValues => ({ log_date: today(), steps: '', resting_heart_rate: '', sleep_duration_hours: '', sleep_quality: '', note: '' })
const showDate = (value: string) => new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(`${value}T12:00:00`))

export default function WellnessPage() {
  const [logs, setLogs] = useState<WellnessLog[]>([])
  const [form, setForm] = useState<FormValues>(blankForm())
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => {
    let active = true
    apiRequest<WellnessLog[]>('/wellness').then(data => { if (active) setLogs(data) }).catch(reason => { if (active) setError(reason.message || 'Unable to load wellness history.') }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [reload])

  function startEdit(log: WellnessLog) {
    setEditing(log.id); setSuccess(''); setError('')
    setForm({ log_date: log.log_date, steps: String(log.steps), resting_heart_rate: log.resting_heart_rate == null ? '' : String(log.resting_heart_rate), sleep_duration_hours: log.sleep_duration_hours == null ? '' : String(log.sleep_duration_hours), sleep_quality: log.sleep_quality == null ? '' : String(log.sleep_quality), note: log.note || '' })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function resetForm() { setEditing(null); setForm(blankForm()); setError('') }
  function set<K extends keyof FormValues>(key: K, value: FormValues[K]) { setForm(previous => ({ ...previous, [key]: value })) }

  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    const payload = {
      log_date: form.log_date,
      steps: Number(form.steps),
      resting_heart_rate: form.resting_heart_rate === '' ? null : Number(form.resting_heart_rate),
      sleep_duration_hours: form.sleep_duration_hours === '' ? null : Number(form.sleep_duration_hours),
      sleep_quality: form.sleep_quality === '' ? null : Number(form.sleep_quality),
      note: form.note.trim() || null,
    }
    try {
      await apiRequest<WellnessLog>(editing ? `/wellness/${editing}` : '/wellness', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) })
      setSuccess(editing ? 'Your entry was updated.' : 'Your daily entry was saved.')
      setEditing(null); setForm(blankForm()); setReload(value => value + 1)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save this entry.') }
    finally { setSaving(false) }
  }

  async function remove(log: WellnessLog) {
    if (!window.confirm(`Delete your wellness entry for ${showDate(log.log_date)}? This cannot be undone.`)) return
    setError(''); setSuccess('')
    try { await apiRequest<void>(`/wellness/${log.id}`, { method: 'DELETE' }); setSuccess('The entry was deleted.'); setReload(value => value + 1) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete this entry.') }
  }

  return <>
    <PageTitle eyebrow="DAILY WELLNESS" title="Check in with yourself" subtitle="One entry per day. Leave anything you don’t have as blank; missing data stays separate from zero." />
    {error && <Feedback>{error}</Feedback>}{success && <Feedback tone="success">{success}</Feedback>}
    <div className="grid items-start gap-5 xl:grid-cols-[.88fr_1.4fr]">
      <Card className="form-card"><div className="section-heading"><div><p className="eyebrow">{editing ? 'EDIT ENTRY' : 'DAILY CHECK-IN'}</p><h2>{editing ? 'Update your entry' : 'How was today?'}</h2></div><div className="metric-icon aqua"><Activity size={18} /></div></div>
        <form className="mt-6 space-y-4" onSubmit={submit}>
          <Field label="Date"><input type="date" required value={form.log_date} onChange={e => set('log_date', e.target.value)} /></Field>
          <Field label="Steps" hint="Enter 0 if you tracked no steps."><input type="number" min="0" max="200000" required value={form.steps} onChange={e => set('steps', e.target.value)} placeholder="e.g. 7,240" /></Field>
          <div className="grid gap-4 sm:grid-cols-2"><Field label="Resting heart rate" hint="Optional · beats per minute"><input type="number" min="30" max="240" value={form.resting_heart_rate} onChange={e => set('resting_heart_rate', e.target.value)} placeholder="e.g. 64" /></Field><Field label="Sleep duration" hint="Optional · hours"><input type="number" min="0" max="24" step="0.1" value={form.sleep_duration_hours} onChange={e => set('sleep_duration_hours', e.target.value)} placeholder="e.g. 7.5" /></Field></div>
          <Field label="Sleep quality" hint="Optional · 1 is low, 5 is high"><select value={form.sleep_quality} onChange={e => set('sleep_quality', e.target.value)}><option value="">Not recorded</option>{[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>{value} · {['', 'Low', 'Fair', 'Okay', 'Good', 'Great'][value]}</option>)}</select></Field>
          <Field label="Note" hint="Optional · private to your account"><textarea rows={3} maxLength={2000} value={form.note} onChange={e => set('note', e.target.value)} placeholder="Anything you’d like to remember about today?" /></Field>
          <div className="flex gap-2 pt-1"><button className="button button-primary flex-1" disabled={saving}>{editing ? <Check size={16} /> : <Plus size={16} />}{saving ? 'Saving…' : editing ? 'Save changes' : 'Save daily entry'}</button>{editing && <button type="button" onClick={resetForm} className="button button-secondary"><X size={16} />Cancel</button>}</div>
        </form>
      </Card>
      <Card className="history-card"><div className="section-heading"><div><p className="eyebrow">YOUR RECORDS</p><h2>Daily history</h2></div><span className="count-pill">{logs.length} {logs.length === 1 ? 'entry' : 'entries'}</span></div>
        {loading ? <Loading label="Loading your entries…" /> : logs.length === 0 ? <EmptyState title="No check-ins yet">Your daily entries will appear here after your first save.</EmptyState> : <div className="record-list">{logs.map(log => <article className="record-row" key={log.id}><div className="record-date"><span>{new Date(`${log.log_date}T12:00:00`).toLocaleDateString(undefined, { month: 'short' })}</span><b>{new Date(`${log.log_date}T12:00:00`).getDate()}</b></div><div className="record-main"><h3>{showDate(log.log_date)}</h3><div className="record-stats"><span><b>{log.steps.toLocaleString()}</b> steps</span><span><b>{log.sleep_duration_hours == null ? '—' : `${log.sleep_duration_hours}h`}</b> sleep</span><span><b>{log.resting_heart_rate ?? '—'}</b> bpm</span></div>{log.note && <p className="record-note">{log.note}</p>}</div><div className="record-actions"><button className="icon-button" onClick={() => startEdit(log)} aria-label={`Edit entry for ${log.log_date}`}><Pencil size={16} /></button><button className="icon-button danger-hover" onClick={() => remove(log)} aria-label={`Delete entry for ${log.log_date}`}><Trash2 size={16} /></button></div></article>)}</div>}
      </Card>
    </div>
  </>
}
