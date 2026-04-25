import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

function RequireAuth() {
  const { status, user } = useAuth() || {}
  const location = useLocation()

  if (status === 'loading') {
    return <p className="muted">Loading…</p>
  }

  if (!user) {
    return <Navigate to="/account" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}

export default RequireAuth
