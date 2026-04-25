import { useEffect, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'
import { getSupabaseClient } from '../lib/supabase'
import { createUserProfile, getUserProfile } from '../lib/api'

function AuthProvider({ children }) {
  const [status, setStatus] = useState('loading')
  const [session, setSession] = useState(null)
  const [error, setError] = useState(null)
  const [profileStatus, setProfileStatus] = useState('idle')

  useEffect(() => {
    let mounted = true
    let subscription = null

    async function init() {
      setStatus('loading')
      setError(null)

      try {
        const supabase = getSupabaseClient()
        const { data, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError
        if (!mounted) return
        setSession(data?.session || null)
        setStatus('ready')

        const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (!mounted) return
          setSession(nextSession)
        })

        subscription = listener?.subscription || null
      } catch (e) {
        if (!mounted) return
        setError(e)
        setStatus('error')
      }
    }

    init()

    return () => {
      mounted = false
      subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function ensureProfile() {
      const userId = session?.user?.id
      const email = session?.user?.email
      if (!userId) {
        setProfileStatus('idle')
        return
      }

      setProfileStatus('loading')
      try {
        await getUserProfile(userId)
        if (!mounted) return
        setProfileStatus('ready')
      } catch (e) {
        if (!mounted) return
        if (e?.status === 404) {
          try {
            await createUserProfile({ user_id: userId, email, display_name: null })
            if (!mounted) return
            setProfileStatus('ready')
            return
          } catch (createErr) {
            if (!mounted) return
            setProfileStatus('error')
            setError(createErr)
            return
          }
        }

        setProfileStatus('error')
        setError(e)
      }
    }

    ensureProfile()
    return () => {
      mounted = false
    }
  }, [session?.user?.id])

  const value = useMemo(() => {
    return {
      status,
      session,
      user: session?.user || null,
      profileStatus,
      error,
    }
  }, [status, session, profileStatus, error])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export default AuthProvider
