export type Profile = {
  id: string
  display_name: string
  height_cm: number | null
  weight_kg: number | null
  step_goal: number
  sleep_goal_hours: number
  created_at: string
  updated_at: string
}

export type WellnessLog = {
  id: string
  log_date: string
  steps: number
  resting_heart_rate: number | null
  sleep_duration_hours: number | null
  sleep_quality: number | null
  note: string | null
  created_at: string
  updated_at: string
}

export type Workout = {
  id: string
  activity_type: string
  duration_minutes: number
  intensity: 'low' | 'moderate' | 'high'
  occurred_at: string
  notes: string | null
  created_at: string
  updated_at: string
}

export type DashboardSummary = {
  period_days: number
  days_logged: number
  average_steps: number | null
  average_sleep_hours: number | null
  latest_log: WellnessLog | null
  step_goal: number
  sleep_goal_hours: number
  trend: { date: string; steps: number | null; sleep_duration_hours: number | null }[]
}

export type Insights = { generated_at: string; summaries: string[] }
