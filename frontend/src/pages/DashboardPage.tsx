import { useEffect, useState } from 'react'
import { Activity, ArrowUpRight, CalendarDays, Footprints, Moon, Plus, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { apiRequest } from '../api/client'
import { Card, EmptyState, Feedback, Loading, PageTitle } from '../components/UI'
import { useAuth } from '../auth/AuthContext'
import type { DashboardSummary, Insights, Profile } from '../types'

const formatDay = (value: string) => new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(new Date(`${value}T12:00:00`))
const number = (value: number | null | undefined) => value == null ? '—' : Math.round(value).toLocaleString()

export default function DashboardPage() {
  const { session } = useAuth()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [insights, setInsights] = useState<Insights | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [notice, setNotice] = useState('')
  const [refresh, setRefresh] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true); setError('')
    Promise.all([apiRequest<DashboardSummary>('/dashboard/summary?days=7'), apiRequest<Insights>('/dashboard/insights'), apiRequest<Profile>('/profile')])
      .then(([summary, summaryInsights, savedProfile]) => { if (active) { setData(summary); setInsights(summaryInsights); setProfile(savedProfile) } })
      .catch(reason => { if (active) setError(reason instanceof Error ? reason.message : 'Unable to load your dashboard.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [refresh])

  async function seedDemo() {
    setSeeding(true); setNotice(''); setError('')
    try {
      const result = await apiRequest<{ message: string; records_created: number }>('/demo/seed', { method: 'POST' })
      setNotice(`${result.records_created} synthetic demo ${result.records_created === 1 ? 'entry' : 'entries'} added. Existing dates were left unchanged.`)
      setRefresh(value => value + 1)
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to add demo entries.') }
    finally { setSeeding(false) }
  }

  const firstName = profile?.display_name.split(' ')[0] || session?.user.user_metadata?.display_name?.split(' ')[0] || session?.user.email?.split('@')[0] || 'there'
  const latest = data?.latest_log
  return <>
    <PageTitle eyebrow="YOUR WELLNESS OVERVIEW" title={`Good to see you, ${firstName}`} subtitle="A clear view of the routines you’ve been building." action={<div className="flex flex-wrap gap-2">{import.meta.env.DEV && <button onClick={seedDemo} disabled={seeding} className="button button-secondary"><Sparkles size={16} />{seeding ? 'Adding sample…' : 'Add demo week'}</button>}<Link to="/wellness" className="button button-primary"><Plus size={17} /> Log today</Link></div>} />
    {error && <Feedback>{error}</Feedback>}{notice && <Feedback tone="success">{notice}</Feedback>}
    {loading ? <Loading /> : data && <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric icon={Footprints} label="Latest steps" value={number(latest?.steps)} detail={latest ? `Recorded ${new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${latest.log_date}T12:00:00`))}` : 'No entries yet'} accent="aqua" />
        <Metric icon={Moon} label="Latest sleep" value={latest?.sleep_duration_hours == null ? '—' : `${latest.sleep_duration_hours.toFixed(1)}h`} detail={latest?.sleep_quality != null ? `Quality ${latest.sleep_quality} of 5` : latest ? 'Sleep not recorded' : 'No entries yet'} accent="violet" />
        <Metric icon={CalendarDays} label="Days logged" value={`${data.days_logged} / 7`} detail="In the last seven days" accent="blue" />
        <Metric icon={Activity} label="Resting heart rate" value={latest?.resting_heart_rate == null ? '—' : `${latest.resting_heart_rate} bpm`} detail={latest ? 'Most recent entry' : 'No entries yet'} accent="pink" />
      </div>
      <div className="mt-5 grid gap-5 xl:grid-cols-[1.55fr_1fr]">
        <Card className="chart-card"><div className="section-heading"><div><p className="eyebrow">LAST 7 DAYS</p><h2>Activity & rest</h2></div><Link to="/wellness" className="text-link">View history <ArrowUpRight size={15} /></Link></div>
          {data.days_logged === 0 ? <EmptyState title="Your story starts with a check-in">Log a daily entry to see your step and sleep trends take shape here.</EmptyState> : <div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.trend} margin={{ top: 12, right: 8, bottom: 0, left: -14 }}><defs><linearGradient id="stepFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#55e2d0" stopOpacity={0.25} /><stop offset="100%" stopColor="#55e2d0" stopOpacity={0} /></linearGradient><linearGradient id="sleepFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a69aff" stopOpacity={0.18} /><stop offset="100%" stopColor="#a69aff" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#263442" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="date" tickFormatter={formatDay} tickLine={false} axisLine={false} tick={{ fill: '#91a0ae', fontSize: 11 }} /><YAxis yAxisId="steps" tickLine={false} axisLine={false} tick={{ fill: '#91a0ae', fontSize: 11 }} tickFormatter={n => n >= 1000 ? `${n / 1000}k` : n} /><YAxis yAxisId="sleep" orientation="right" domain={[0, 'dataMax + 2']} hide /><Tooltip contentStyle={{ background: '#151f2a', border: '1px solid #263442', borderRadius: 12, color: '#f7fafc' }} labelFormatter={v => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${v}T12:00:00`))} formatter={(value, name) => [value == null ? 'Not recorded' : name === 'Steps' ? Number(value).toLocaleString() : `${Number(value).toFixed(1)} hours`, name]} /><Area yAxisId="steps" type="monotone" dataKey="steps" name="Steps" stroke="#55e2d0" strokeWidth={2.5} fill="url(#stepFill)" connectNulls={false} /><Area yAxisId="sleep" type="monotone" dataKey="sleep_duration_hours" name="Sleep" stroke="#a69aff" strokeWidth={2} fill="url(#sleepFill)" connectNulls={false} /></AreaChart></ResponsiveContainer></div>}
          <div className="chart-legend"><span><i className="legend-dot aqua-dot" /> Steps</span><span><i className="legend-dot violet-dot" /> Sleep hours</span><span className="ml-auto">Average: {number(data.average_steps)} steps · {data.average_sleep_hours == null ? '—' : `${data.average_sleep_hours.toFixed(1)}h sleep`}</span></div>
        </Card>
        <Card className="insights-card"><div className="section-heading"><div><p className="eyebrow">PATTERNS, MADE CLEAR</p><h2>Weekly notes</h2></div><span className="sparkle-icon"><Sparkles size={17} /></span></div>
          {insights?.summaries.length ? <ul className="insight-list">{insights.summaries.map((item, index) => <li key={item}><span className="insight-index">0{index + 1}</span><p>{item}</p></li>)}</ul> : <EmptyState title="No summary yet">Add a few daily check-ins and your weekly notes will appear here.</EmptyState>}
          <p className="insight-foot">Based only on your saved records and goals.</p>
        </Card>
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <GoalPanel label="Step goal" actual={data.average_steps} target={data.step_goal} unit="steps" color="aqua" />
        <GoalPanel label="Sleep goal" actual={data.average_sleep_hours} target={data.sleep_goal_hours} unit="hours" color="violet" />
      </div>
    </>}
  </>
}

function Metric({ icon: Icon, label, value, detail, accent }: { icon: typeof Activity; label: string; value: string; detail: string; accent: string }) {
  return <Card className="metric-card"><div className={`metric-icon ${accent}`}><Icon size={19} /></div><p className="metric-label">{label}</p><p className="metric-value">{value}</p><p className="metric-detail">{detail}</p></Card>
}

function GoalPanel({ label, actual, target, unit, color }: { label: string; actual: number | null; target: number; unit: string; color: string }) {
  const progress = actual == null ? 0 : Math.min(100, Math.round((actual / target) * 100))
  return <Card className="goal-card"><div className="flex items-center justify-between"><div><p className="eyebrow">7-DAY AVERAGE</p><h3 className="mt-2 font-medium text-white">{label}</h3></div><span className={`goal-percent ${color}`}>{actual == null ? '—' : `${progress}%`}</span></div><div className="goal-track"><div className={`goal-fill ${color}`} style={{ width: `${progress}%` }} /></div><div className="mt-2 flex justify-between text-xs text-muted"><span>{actual == null ? 'No data yet' : `${unit === 'steps' ? Math.round(actual).toLocaleString() : `${actual.toFixed(1)} ${unit}`} average`}</span><span>Goal {unit === 'steps' ? Math.round(target).toLocaleString() : `${target} ${unit}`}</span></div></Card>
}
