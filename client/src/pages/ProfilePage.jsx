import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { getUserProfile, updateUserProfile } from '../lib/api'

function ProfilePage() {
  const { user, profileStatus } = useAuth() || {}
  const userId = user?.id

  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let mounted = true

    async function load() {
      if (!userId) return
      setStatus('loading')
      setError(null)
      try {
        const data = await getUserProfile(userId)
        if (!mounted) return
        setProfile(data)
        setStatus('success')
      } catch (e) {
        if (!mounted) return
        setError(e)
        setStatus('error')
      }
    }

    if (profileStatus === 'ready') load()

    return () => {
      mounted = false
    }
  }, [userId, profileStatus])

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    setError(null)
    try {
      const patch = {
        display_name: profile?.display_name ?? null,
        budget_preference: profile?.budget_preference ?? null,
        home_location: profile?.home_location ?? null,
        work_or_school_location: profile?.work_or_school_location ?? null,
      }
      const updated = await updateUserProfile(userId, patch)
      setProfile(updated)
    } catch (e) {
      setError(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <h1>Profile</h1>
        <p className="page-subtitle">Your preferences (budget, locations, display name).</p>
      </header>

      {profileStatus === 'loading' ? <p className="muted">Preparing your profile…</p> : null}
      {status === 'loading' ? <p className="muted">Loading…</p> : null}
      {status === 'error' ? <p className="muted">{error?.message || 'Failed to load profile'}</p> : null}

      <section className="section">
        <h2>Account</h2>
        <div className="card">
          <div className="form-row">
            <label className="label">
              Display name
              <input
                className="input"
                placeholder="Morgan"
                value={profile?.display_name || ''}
                onChange={(e) => setProfile((p) => ({ ...(p || {}), display_name: e.target.value }))}
                disabled={status !== 'success'}
              />
            </label>
            <label className="label">
              Budget preference
              <select
                className="input"
                value={profile?.budget_preference || ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...(p || {}), budget_preference: e.target.value || null }))
                }
                disabled={status !== 'success'}
              >
                <option value="">Not set</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving || status !== 'success'}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
          {error && status === 'success' ? <p className="muted">{error.message}</p> : null}
        </div>
      </section>

      <section className="section">
        <h2>Locations</h2>
        <div className="card">
          <div className="form-row">
            <label className="label">
              Home
              <input
                className="input"
                placeholder="100 Main St"
                value={profile?.home_location || ''}
                onChange={(e) => setProfile((p) => ({ ...(p || {}), home_location: e.target.value }))}
                disabled={status !== 'success'}
              />
            </label>
            <label className="label">
              Work
              <input
                className="input"
                placeholder="200 Broadway"
                value={profile?.work_or_school_location || ''}
                onChange={(e) =>
                  setProfile((p) => ({ ...(p || {}), work_or_school_location: e.target.value }))
                }
                disabled={status !== 'success'}
              />
            </label>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ProfilePage
