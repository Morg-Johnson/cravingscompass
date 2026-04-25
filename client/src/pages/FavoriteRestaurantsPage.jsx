import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  addFavorite,
  clearFavorites,
  getFavorites,
  getRestaurantById,
  getRestaurants,
} from '../lib/api'

function FavoriteRestaurantsPage() {
  const { user, profileStatus } = useAuth() || {}
  const userId = user?.id

  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [restaurantById, setRestaurantById] = useState({})
  const [restaurantsStatus, setRestaurantsStatus] = useState('idle')
  const [restaurants, setRestaurants] = useState([])
  const [restaurantId, setRestaurantId] = useState('')
  const [adding, setAdding] = useState(false)
  const [clearing, setClearing] = useState(false)

  async function load() {
    if (!userId) return
    setStatus('loading')
    setError(null)
    try {
      const data = await getFavorites(userId)
      setItems(Array.isArray(data) ? data : [])
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

  useEffect(() => {
    let mounted = true

    async function loadRestaurants() {
      setRestaurantsStatus('loading')
      try {
        const data = await getRestaurants()
        if (!mounted) return
        setRestaurants(Array.isArray(data) ? data : [])
        setRestaurantsStatus('success')
      } catch {
        if (!mounted) return
        setRestaurants([])
        setRestaurantsStatus('error')
      }
    }

    loadRestaurants()
    return () => {
      mounted = false
    }
  }, [])

  const restaurantIds = useMemo(() => {
    const ids = new Set()
    for (const row of items) {
      if (row?.restaurant_id) ids.add(row.restaurant_id)
    }
    return Array.from(ids)
  }, [items])

  useEffect(() => {
    let mounted = true

    async function hydrateRestaurants() {
      if (restaurantIds.length === 0) return
      const missing = restaurantIds.filter((id) => !restaurantById[id])
      if (missing.length === 0) return

      try {
        const results = await Promise.all(
          missing.map(async (id) => {
            try {
              const r = await getRestaurantById(id)
              return [id, r]
            } catch {
              return [id, null]
            }
          })
        )

        if (!mounted) return
        setRestaurantById((prev) => {
          const next = { ...prev }
          for (const [id, r] of results) next[id] = r
          return next
        })
      } catch {
        // ignore hydration errors
      }
    }

    hydrateRestaurants()
    return () => {
      mounted = false
    }
  }, [restaurantIds, restaurantById])

  async function handleAdd() {
    if (!userId) return
    if (!restaurantId.trim()) return
    setAdding(true)
    setError(null)
    try {
      await addFavorite(userId, restaurantId.trim())
      setRestaurantId('')
      await load()
    } catch (e) {
      setError(e)
    } finally {
      setAdding(false)
    }
  }

  async function handleClear() {
    if (!userId) return
    setClearing(true)
    setError(null)
    try {
      await clearFavorites(userId)
      await load()
    } catch (e) {
      setError(e)
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="page">
      <section className="section">
        <h2>Favorites</h2>
        <div className="card">
          <div className="form-row">
            <label className="label">
              Restaurant
              <select
                className="input"
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                disabled={status === 'loading' || restaurantsStatus === 'loading'}
              >
                <option value="">Select a restaurant…</option>
                {restaurants.map((r) => (
                  <option key={r.restaurant_id} value={r.restaurant_id}>
                    {r.name}{r.location_address ? ` — ${r.location_address}` : ''}
                  </option>
                ))}
              </select>
            </label>
            <div className="actions" style={{ alignItems: 'end' }}>
              <button type="button" className="btn btn--primary" onClick={handleAdd} disabled={adding || !restaurantId.trim()}>
                {adding ? 'Adding…' : 'Add favorite'}
              </button>
              <button type="button" className="btn" onClick={handleClear} disabled={clearing || items.length === 0}>
                {clearing ? 'Clearing…' : 'Clear all'}
              </button>
              <button type="button" className="btn" onClick={load} disabled={status === 'loading'}>
                Refresh
              </button>
            </div>
          </div>

          {profileStatus === 'loading' ? <p className="muted">Preparing your profile…</p> : null}
          {status === 'loading' ? <p className="muted">Loading…</p> : null}
          {status === 'error' ? <p className="muted">{error?.message || 'Failed to load favorites'}</p> : null}
          {status === 'success' && items.length === 0 ? <p className="muted">No favorites yet.</p> : null}

          {items.length > 0 ? (
            <div className="list">
              {items.map((row) => (
                <div key={row?.favorite_id || row?.restaurant_id} className="list-row">
                  <div>
                    <div className="row-title">{restaurantById[row?.restaurant_id]?.name || 'Restaurant'}</div>
                    {restaurantById[row?.restaurant_id]?.location_address ? (
                      <div className="row-meta">{restaurantById[row?.restaurant_id]?.location_address}</div>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default FavoriteRestaurantsPage
