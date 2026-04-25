import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getSupabaseClient } from '../lib/supabase'
import { getUserProfile, updateUserProfile } from '../lib/api'

function AccountPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, profileStatus } = useAuth() || {}

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const [profileLoadStatus, setProfileLoadStatus] = useState('idle')
  const [profile, setProfile] = useState(null)
  const [saving, setSaving] = useState(false)

  const redirectTo = location.state?.from || '/'

  useEffect(() => {
    let mounted = true

    async function loadProfile() {
      if (!user?.id) return
      if (profileStatus !== 'ready') return

      setProfileLoadStatus('loading')
      setError(null)
      try {
        const data = await getUserProfile(user.id)
        if (!mounted) return
        setProfile(data)
        setProfileLoadStatus('success')
      } catch (e) {
        if (!mounted) return
        setError(e)
        setProfileLoadStatus('error')
      }
    }

    loadProfile()

    return () => {
      mounted = false
    }
  }, [user?.id, profileStatus])

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('loading')
    setError(null)

    try {
      const supabase = getSupabaseClient()

      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        setStatus('success')
        setError(
          new Error(
            'Account created. If email confirmation is enabled, check your inbox before logging in.'
          )
        )
        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (signInError) throw signInError
      setStatus('success')
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setStatus('error')
      setError(err)
    }
  }

  async function handleSignOut() {
    setStatus('loading')
    setError(null)
    try {
      const supabase = getSupabaseClient()
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) throw signOutError
      setStatus('success')
    } catch (err) {
      setStatus('error')
      setError(err)
    }
  }

  async function handleSaveProfile() {
    if (!user?.id) return
    setSaving(true)
    setError(null)
    try {
      const patch = {
        display_name: profile?.display_name ?? null,
        budget_preference: profile?.budget_preference ?? null,
        home_location: profile?.home_location ?? null,
        work_or_school_location: profile?.work_or_school_location ?? null,
      }
      const updated = await updateUserProfile(user.id, patch)
      setProfile(updated)
    } catch (e) {
      setError(e)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page">
      {!user ? (
        <>
          <section className="section">
            <div className="card">
              <div className="actions" style={{ marginBottom: 12 }}>
                <button
                  type="button"
                  className={`btn${mode === 'login' ? ' btn--primary' : ''}`}
                  onClick={() => setMode('login')}
                  disabled={status === 'loading'}
                >
                  Log in
                </button>
                <button
                  type="button"
                  className={`btn${mode === 'signup' ? ' btn--primary' : ''}`}
                  onClick={() => setMode('signup')}
                  disabled={status === 'loading'}
                >
                  Sign up
                </button>
                <button type="button" className="btn" onClick={() => navigate('/search')}>
                  Continue as guest
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <label className="label">
                    Email
                    <input
                      className="input"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                      required
                    />
                  </label>
                  <label className="label">
                    Password
                    <input
                      className="input"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                      required
                      minLength={6}
                    />
                  </label>
                </div>

                <div className="actions">
                  <button type="submit" className="btn btn--primary" disabled={status === 'loading'}>
                    {mode === 'signup' ? 'Create account' : 'Log in'}
                  </button>
                </div>
              </form>

              {error ? <p className="muted">{error.message}</p> : null}
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="section">
            <div className="card">
              <div className="actions">
                <button type="button" className="btn" onClick={handleSignOut} disabled={status === 'loading'}>
                  Sign out
                </button>
                <button type="button" className="btn btn--primary" onClick={() => navigate('/search')}>
                  Browse deals
                </button>
              </div>
              {error ? <p className="muted">{error.message}</p> : null}
            </div>
          </section>

          <section className="section">
            <h2>Profile</h2>
            <div className="card">
              {profileStatus === 'loading' || profileLoadStatus === 'loading' ? (
                <p className="muted">Loading…</p>
              ) : null}

              <div className="form-row">
                <label className="label">
                  Display name
                  <input
                    className="input"
                    placeholder="Morgan"
                    value={profile?.display_name || ''}
                    onChange={(e) => setProfile((p) => ({ ...(p || {}), display_name: e.target.value }))}
                    disabled={profileLoadStatus !== 'success'}
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
                    disabled={profileLoadStatus !== 'success'}
                  >
                    <option value="">Not set</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </label>
              </div>

              <div className="form-row">
                <label className="label">
                  Home
                  <input
                    className="input"
                    placeholder="100 Main St"
                    value={profile?.home_location || ''}
                    onChange={(e) => setProfile((p) => ({ ...(p || {}), home_location: e.target.value }))}
                    disabled={profileLoadStatus !== 'success'}
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
                    disabled={profileLoadStatus !== 'success'}
                  />
                </label>
              </div>

              <div className="actions">
                <button type="button" className="btn btn--primary" onClick={handleSaveProfile} disabled={saving || profileLoadStatus !== 'success'}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}

export default AccountPage
