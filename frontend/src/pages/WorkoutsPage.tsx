import { useEffect, useState, type FormEvent } from 'react'
import { Check, Dumbbell, Pencil, Plus, Timer, Trash2, X } from 'lucide-react'
import { apiRequest } from '../api/client'
import { Card, EmptyState, Feedback, Field, Loading, PageTitle } from '../components/UI'
import type { Workout } from '../types'

type WorkoutForm = { activity_type: string; duration_minutes: string; intensity: Workout['intensity']; occurred_at: string; notes: string }
const localDateTime = () => { const date = new Date(Date.now() - new Date().getTimezoneOffset() * 60000); return date.toISOString().slice(0, 16) }
const emptyForm = (): WorkoutForm => ({ activity_type: '', duration_minutes: '', intensity: 'moderate', occurred_at: localDateTime(), notes: '' })
const formatDate = (value: string) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value))

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [form, setForm] = useState<WorkoutForm>(emptyForm())
  const [editing, setEditing] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [reload, setReload] = useState(0)
  useEffect(() => { let active = true; apiRequest<Workout[]>('/workouts').then(data => { if (active) setWorkouts(data) }).catch(reason => { if (active) setError(reason.message || 'Unable to load workout history.') }).finally(() => { if (active) setLoading(false) }); return () => { active = false } }, [reload])
  function set<K extends keyof WorkoutForm>(key: K, value: WorkoutForm[K]) { setForm(previous => ({ ...previous, [key]: value })) }
  function edit(workout: Workout) { setEditing(workout.id); setError(''); setSuccess(''); setForm({ activity_type: workout.activity_type, duration_minutes: String(workout.duration_minutes), intensity: workout.intensity, occurred_at: workout.occurred_at.slice(0, 16), notes: workout.notes || '' }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function cancel() { setEditing(null); setForm(emptyForm()) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    const payload = { activity_type: form.activity_type.trim(), duration_minutes: Number(form.duration_minutes), intensity: form.intensity, occurred_at: new Date(form.occurred_at).toISOString(), notes: form.notes.trim() || null }
    try { await apiRequest<Workout>(editing ? `/workouts/${editing}` : '/workouts', { method: editing ? 'PATCH' : 'POST', body: JSON.stringify(payload) }); setSuccess(editing ? 'Workout updated.' : 'Workout saved.'); cancel(); setReload(value => value + 1) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save workout.') }
    finally { setSaving(false) }
  }
  async function remove(workout: Workout) {
    if (!window.confirm(`Delete your ${workout.activity_type} workout from ${formatDate(workout.occurred_at)}?`)) return
    setError(''); setSuccess('')
    try { await apiRequest<void>(`/workouts/${workout.id}`, { method: 'DELETE' }); setSuccess('Workout deleted.'); setReload(value => value + 1) }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to delete workout.') }
  }
  return <>
    <PageTitle eyebrow="MOVEMENT THAT MATTERS TO YOU" title="Workout journal" subtitle="Keep a simple history of the sessions that make up your week." />
    {error && <Feedback>{error}</Feedback>}{success && <Feedback tone="success">{success}</Feedback>}
    <div className="grid items-start gap-5 xl:grid-cols-[.82fr_1.45fr]">
      <Card className="form-card"><div className="section-heading"><div><p className="eyebrow">{editing ? 'EDIT SESSION' : 'NEW SESSION'}</p><h2>{editing ? 'Update workout' : 'Log a workout'}</h2></div><div className="metric-icon violet"><Dumbbell size={18} /></div></div>
        <form className="mt-6 space-y-4" onSubmit={submit}><Field label="Activity"><input required maxLength={80} value={form.activity_type} onChange={e => set('activity_type', e.target.value)} placeholder="e.g. Strength training" /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Duration · minutes"><input required type="number" min="1" max="1440" value={form.duration_minutes} onChange={e => set('duration_minutes', e.target.value)} placeholder="45" /></Field><Field label="Intensity"><select value={form.intensity} onChange={e => set('intensity', e.target.value as Workout['intensity'])}><option value="low">Low</option><option value="moderate">Moderate</option><option value="high">High</option></select></Field></div><Field label="When"><input required type="datetime-local" value={form.occurred_at} onChange={e => set('occurred_at', e.target.value)} /></Field><Field label="Notes" hint="Optional · private to your account"><textarea rows={3} maxLength={2000} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="How did the session feel?" /></Field><div className="flex gap-2"><button className="button button-primary flex-1" disabled={saving}>{editing ? <Check size={16} /> : <Plus size={16} />}{saving ? 'Saving…' : editing ? 'Save changes' : 'Save workout'}</button>{editing && <button type="button" onClick={cancel} className="button button-secondary"><X size={16} />Cancel</button>}</div></form>
      </Card>
      <Card className="history-card"><div className="section-heading"><div><p className="eyebrow">YOUR SESSIONS</p><h2>Workout history</h2></div><span className="count-pill">{workouts.length} {workouts.length === 1 ? 'session' : 'sessions'}</span></div>
        {loading ? <Loading label="Loading workouts…" /> : workouts.length === 0 ? <EmptyState title="No workouts logged yet">Add a workout when you’re ready. Your history will build here over time.</EmptyState> : <div className="record-list">{workouts.map(workout => <article className="workout-row" key={workout.id}><div className="workout-icon"><Dumbbell size={19} /></div><div className="record-main"><div className="flex flex-wrap items-center gap-2"><h3>{workout.activity_type}</h3><span className={`intensity intensity-${workout.intensity}`}>{workout.intensity}</span></div><div className="record-stats"><span>{formatDate(workout.occurred_at)}</span><span><Timer size={13} /> <b>{workout.duration_minutes}</b> min</span></div>{workout.notes && <p className="record-note">{workout.notes}</p>}</div><div className="record-actions"><button className="icon-button" onClick={() => edit(workout)} aria-label={`Edit ${workout.activity_type} workout`}><Pencil size={16} /></button><button className="icon-button danger-hover" onClick={() => remove(workout)} aria-label={`Delete ${workout.activity_type} workout`}><Trash2 size={16} /></button></div></article>)}</div>}
      </Card>
    </div>
  </>
}
