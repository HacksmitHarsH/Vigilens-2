import { Activity, ArrowRight, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { Feedback } from '../components/UI'

export default function AuthPage({ mode = 'login' }: { mode?: 'login' | 'register' }) {
  const isRegister = mode === 'register'
  const { signIn, signUp, configured, session } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => { if (session) navigate('/') }, [session, navigate])
  if (session) return null
  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setSuccess(''); setBusy(true)
    try {
      if (isRegister) {
        await signUp(email, password, displayName.trim())
        setSuccess('Account created. If email confirmation is enabled, check your inbox to finish signing in.')
      } else {
        await signIn(email, password)
        navigate('/')
      }
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Something went wrong. Please try again.') }
    finally { setBusy(false) }
  }

  return <main className="auth-page"><section className="auth-visual"><div className="auth-orbit orbit-one" /><div className="auth-orbit orbit-two" /><div className="auth-brand"><div className="brand-mark"><Activity size={21} /></div><span className="brand-name">vigilens</span></div><div className="auth-hero-copy"><p className="eyebrow">WELLNESS, IN FOCUS</p><h1>Small signals.<br /><span>Clearer patterns.</span></h1><p>Bring your daily movement, sleep, and workouts into one thoughtful view.</p><div className="auth-feature"><ShieldCheck size={17} /><span>Your records stay private to your account.</span></div></div><div className="auth-visual-foot">MONITOR <b>·</b> UNDERSTAND <b>·</b> ACT</div></section>
    <section className="auth-form-wrap"><div className="auth-form-box"><p className="eyebrow">WELCOME {isRegister ? 'ABOARD' : 'BACK'}</p><h2>{isRegister ? 'Create your account' : 'Sign in to Vigilens'}</h2><p className="auth-sub">{isRegister ? 'Start building a clearer picture of your routines.' : 'Pick up where you left off.'}</p>
      {!configured && <Feedback tone="info">Connect Supabase to enable accounts. Add the values from <code>frontend/.env.example</code> to <code>frontend/.env</code>, then restart the frontend.</Feedback>}
      {error && <Feedback>{error}</Feedback>}{success && <Feedback tone="success">{success}</Feedback>}
      <form onSubmit={submit} className="mt-7 space-y-5">
        {isRegister && <label className="field"><span>Display name</span><input required minLength={1} maxLength={120} value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="How should we address you?" autoComplete="name" /></label>}
        <label className="field"><span>Email address</span><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" /></label>
        <label className="field"><span>Password</span><span className="password-wrap"><input type={showPassword ? 'text' : 'password'} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" autoComplete={isRegister ? 'new-password' : 'current-password'} /><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></span></label>
        <button className="button button-primary w-full" disabled={busy || !configured}>{busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}<ArrowRight size={17} /></button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">{isRegister ? 'Already have an account?' : 'New to Vigilens?'} <Link className="text-aqua hover:underline" to={isRegister ? '/login' : '/register'}>{isRegister ? 'Sign in' : 'Create an account'}</Link></p>
    </div><p className="auth-legal">Wellness tracking for personal awareness. Not medical advice.</p></section></main>
}
