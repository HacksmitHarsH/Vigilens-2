import { Activity, ChartNoAxesCombined, CircleUserRound, Dumbbell, HeartPulse, LogOut, Menu, X } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { useEffect } from 'react'
import { useAuth } from '../auth/AuthContext'
import { apiRequest } from '../api/client'
import type { Profile } from '../types'

const links = [
  { to: '/', label: 'Overview', icon: ChartNoAxesCombined, end: true },
  { to: '/wellness', label: 'Daily wellness', icon: HeartPulse },
  { to: '/workouts', label: 'Workouts', icon: Dumbbell },
  { to: '/profile', label: 'Profile & goals', icon: CircleUserRound },
]

export default function AppShell() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [profileName, setProfileName] = useState('')
  useEffect(() => {
    if (session) apiRequest<Profile>('/profile').then(profile => setProfileName(profile.display_name)).catch(() => undefined)
  }, [session?.user.id])
  const name = profileName || session?.user.user_metadata?.display_name || session?.user.email?.split('@')[0] || 'Member'
  async function logout() {
    await signOut()
    navigate('/login')
  }
  return <div className="app-shell">
    <aside className={`sidebar ${open ? 'sidebar-open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Activity size={21} strokeWidth={2.4} /></div><div><span className="brand-name">vigilens</span><span className="brand-tag">MONITOR · UNDERSTAND · ACT</span></div><button className="mobile-close" onClick={() => setOpen(false)} aria-label="Close navigation"><X size={19} /></button></div>
      <div className="nav-label">YOUR SPACE</div>
      <nav className="nav-list" aria-label="Main navigation">{links.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => `nav-link ${isActive ? 'nav-active' : ''}`}><Icon size={18} /><span>{label}</span></NavLink>)}</nav>
      <div className="sidebar-bottom"><div className="profile-chip"><div className="avatar">{name.slice(0, 1).toUpperCase()}</div><div className="min-w-0"><p className="truncate text-sm font-medium text-white">{name}</p><p className="truncate text-xs text-muted">{session?.user.email}</p></div></div><button onClick={logout} className="logout-link"><LogOut size={16} /> Sign out</button></div>
    </aside>
    {open && <button className="mobile-scrim" onClick={() => setOpen(false)} aria-label="Close menu" />}
    <main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={() => setOpen(true)} aria-label="Open navigation"><Menu size={20} /></button><div className="topbar-kicker"><span className="live-dot" /> YOUR WELLNESS, IN FOCUS</div><div className="topbar-date">{new Intl.DateTimeFormat(undefined, { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</div></header><div className="page-content"><Outlet /></div></main>
  </div>
}
