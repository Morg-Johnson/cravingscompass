import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getSupabaseClient } from '../lib/supabase'
import { useAuth } from '../auth/AuthContext'

function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, status: authStatus, error: authError } = useAuth() || {}

  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)

  const redirectTo = location.state?.from || '/'

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

  return (
    <div className="page">
      <header className="page-header">
        <h1>Login / Sign Up</h1>
        <p className="page-subtitle">Create an account or log in to sync saved deals and rewards.</p>
      </header>

      <section className="section">
        <h2>Authentication</h2>
        <div className="card">
          {authStatus === 'error' ? (
            <p className="muted">{authError?.message || 'Auth initialization failed'}</p>
          ) : null}

          {user ? (
            <>
              <p className="muted">
                Signed in as <code>{user.email}</code>
              </p>
              <div className="actions">
                <button type="button" className="btn" onClick={handleSignOut} disabled={status === 'loading'}>
                  Sign out
                </button>
                <Link className="btn btn--primary" to={redirectTo}>
                  Continue
                </Link>
              </div>
            </>
          ) : (
            <>
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
                <Link className="btn" to="/guest">
                  Continue as guest
                </Link>
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
            </>
          )}

          {error ? <p className="muted">{error.message}</p> : null}
        </div>
      </section>
    </div>
  )
}

export default LoginPage
