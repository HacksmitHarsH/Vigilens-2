import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from './auth/AuthContext'
import AppShell from './components/AppShell'
import { Loading } from './components/UI'
import AuthPage from './pages/AuthPage'
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const WellnessPage = lazy(() => import('./pages/WellnessPage'))
const WorkoutsPage = lazy(() => import('./pages/WorkoutsPage'))

function Protected({ children }: { children: JSX.Element }) {
  const { session, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-ink"><Loading label="Restoring your session…" /></div>
  return session ? children : <Navigate to="/login" replace />
}

export default function App() {
  return <Routes>
    <Route path="/login" element={<AuthPage />} />
    <Route path="/register" element={<AuthPage mode="register" />} />
    <Route element={<Protected><AppShell /></Protected>}>
      <Route index element={<Suspense fallback={<Loading />}><DashboardPage /></Suspense>} />
      <Route path="wellness" element={<Suspense fallback={<Loading />}><WellnessPage /></Suspense>} />
      <Route path="workouts" element={<Suspense fallback={<Loading />}><WorkoutsPage /></Suspense>} />
      <Route path="profile" element={<Suspense fallback={<Loading />}><ProfilePage /></Suspense>} />
    </Route>
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
}
