import { useEffect, useState, type FormEvent } from 'react'
import { Check, Save, UserRound } from 'lucide-react'
import { apiRequest } from '../api/client'
import { useAuth } from '../auth/AuthContext'
import { Card, Feedback, Field, Loading, PageTitle } from '../components/UI'
import type { Profile } from '../types'

type ProfileForm = { display_name: string; height_cm: string; weight_kg: string; step_goal: string; sleep_goal_hours: string }
export default function ProfilePage() {
  const { session } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [form, setForm] = useState<ProfileForm>({ display_name: '', height_cm: '', weight_kg: '', step_goal: '8000', sleep_goal_hours: '8' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  useEffect(() => { apiRequest<Profile>('/profile').then(data => { setProfile(data); setForm({ display_name: data.display_name, height_cm: data.height_cm == null ? '' : String(data.height_cm), weight_kg: data.weight_kg == null ? '' : String(data.weight_kg), step_goal: String(data.step_goal), sleep_goal_hours: String(data.sleep_goal_hours) }) }).catch(reason => setError(reason.message || 'Unable to load your profile.')).finally(() => setLoading(false)) }, [])
  function set<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) { setForm(previous => ({ ...previous, [key]: value })) }
  async function submit(event: FormEvent) {
    event.preventDefault(); setSaving(true); setError(''); setSuccess('')
    const payload = { display_name: form.display_name.trim(), height_cm: form.height_cm === '' ? null : Number(form.height_cm), weight_kg: form.weight_kg === '' ? null : Number(form.weight_kg), step_goal: Number(form.step_goal), sleep_goal_hours: Number(form.sleep_goal_hours) }
    try { const updated = await apiRequest<Profile>('/profile', { method: 'PUT', body: JSON.stringify(payload) }); setProfile(updated); setSuccess('Your profile and goals are saved.') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to save profile.') }
    finally { setSaving(false) }
  }
  return <>
    <PageTitle eyebrow="YOUR PREFERENCES" title="Profile & goals" subtitle="Set the personal details and daily targets that shape your dashboard." />
    {error && <Feedback>{error}</Feedback>}{success && <Feedback tone="success">{success}</Feedback>}
    {loading ? <Loading label="Loading your profile…" /> : profile && <div className="grid items-start gap-5 xl:grid-cols-[.7fr_1.3fr]">
      <Card className="profile-summary"><div className="profile-avatar-large"><UserRound size={28} /></div><p className="eyebrow">VIGILENS MEMBER</p><h2>{profile.display_name}</h2><p className="text-sm text-muted">{session?.user.email}</p><div className="profile-divider" /><div className="profile-summary-row"><span>Step goal</span><b>{profile.step_goal.toLocaleString()} / day</b></div><div className="profile-summary-row"><span>Sleep goal</span><b>{profile.sleep_goal_hours} hours</b></div><p className="profile-disclaimer">These goals help describe your own recorded activity. They are not medical targets.</p></Card>
      <Card className="form-card"><div className="section-heading"><div><p className="eyebrow">PERSONAL DETAILS</p><h2>Your settings</h2></div><div className="metric-icon aqua"><UserRound size={18} /></div></div><form className="mt-6 space-y-5" onSubmit={submit}><Field label="Display name"><input required minLength={1} maxLength={120} value={form.display_name} onChange={e => set('display_name', e.target.value)} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="Height · centimeters" hint="Optional"><input type="number" min="50" max="260" step="0.1" value={form.height_cm} onChange={e => set('height_cm', e.target.value)} placeholder="Not set" /></Field><Field label="Weight · kilograms" hint="Optional"><input type="number" min="10" max="500" step="0.1" value={form.weight_kg} onChange={e => set('weight_kg', e.target.value)} placeholder="Not set" /></Field></div><div className="profile-divider" /><p className="eyebrow">DAILY GOALS</p><div className="grid gap-4 sm:grid-cols-2"><Field label="Step goal"><input required type="number" min="500" max="100000" step="500" value={form.step_goal} onChange={e => set('step_goal', e.target.value)} /></Field><Field label="Sleep goal · hours"><input required type="number" min="1" max="16" step="0.5" value={form.sleep_goal_hours} onChange={e => set('sleep_goal_hours', e.target.value)} /></Field></div><button className="button button-primary" disabled={saving}>{saving ? <Check size={16} /> : <Save size={16} />}{saving ? 'Saving…' : 'Save profile'}</button></form></Card>
    </div>}
  </>
}
