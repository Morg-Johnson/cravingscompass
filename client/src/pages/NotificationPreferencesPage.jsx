import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  getNotificationPreferences,
  setNotificationPreference,
  updateNotificationPreference,
} from '../lib/api'

function NotificationPreferencesPage() {
  const { user, profileStatus } = useAuth() || {}
  const userId = user?.id

  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [prefs, setPrefs] = useState([])
  const [busyType, setBusyType] = useState(null)

  async function load() {
    if (!userId) return
    setStatus('loading')
    setError(null)
    try {
      const data = await getNotificationPreferences(userId)
      setPrefs(Array.isArray(data) ? data : [])
      setStatus('success')
    } catch (e) {
      setError(e)
      setStatus('error')
    }
  }

  useEffect(() => {
    if (profileStatus === 'ready') load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, profileStatus])

  const byType = useMemo(() => {
    const map = new Map()
    for (const p of prefs) {
      if (p?.notification_type) map.set(p.notification_type, p)
    }
    return map
  }, [prefs])

  function isEnabled(type) {
    const p = byType.get(type)
    return p ? Boolean(p.is_enabled) : false
  }

  async function toggle(type) {
    if (!userId) return
    setBusyType(type)
    setError(null)
    try {
      const next = !isEnabled(type)
      if (byType.has(type)) {
        await updateNotificationPreference(userId, type, next)
      } else {
        await setNotificationPreference(userId, type, next)
      }
      await load()
    } catch (e) {
      setError(e)
    } finally {
      setBusyType(null)
    }
  }

  return (
    <div className="page">
      <section className="section">
        <h2>Toggles</h2>
        <div className="card">
          <div className="actions" style={{ marginBottom: 12 }}>
            <button type="button" className="btn" onClick={load} disabled={status === 'loading'}>
              Refresh
            </button>
          </div>

          {profileStatus === 'loading' ? <p className="muted">Preparing your profile…</p> : null}
          {status === 'loading' ? <p className="muted">Loading…</p> : null}
          {status === 'error' ? (
            <p className="muted">{error?.message || 'Failed to load preferences'}</p>
          ) : null}

          <div className="list">
            <div className="list-row">
              <div>
                <div className="row-title">Expiring deals</div>
                <div className="row-meta">Alert when a deal is close to expiring</div>
              </div>
              <button
                type="button"
                className={`btn${isEnabled('expiring_deals') ? ' btn--primary' : ''}`}
                onClick={() => toggle('expiring_deals')}
                disabled={busyType === 'expiring_deals' || status === 'loading'}
              >
                {busyType === 'expiring_deals'
                  ? 'Saving…'
                  : isEnabled('expiring_deals')
                    ? 'Enabled'
                    : 'Disabled'}
              </button>
            </div>
            <div className="list-row">
              <div>
                <div className="row-title">Expiring points</div>
                <div className="row-meta">Alert when rewards points are expiring soon</div>
              </div>
              <button
                type="button"
                className={`btn${isEnabled('expiring_points') ? ' btn--primary' : ''}`}
                onClick={() => toggle('expiring_points')}
                disabled={busyType === 'expiring_points' || status === 'loading'}
              >
                {busyType === 'expiring_points'
                  ? 'Saving…'
                  : isEnabled('expiring_points')
                    ? 'Enabled'
                    : 'Disabled'}
              </button>
            </div>
          </div>
          {error && status === 'success' ? <p className="muted">{error.message}</p> : null}
        </div>
      </section>
    </div>
  )
}

export default NotificationPreferencesPage
