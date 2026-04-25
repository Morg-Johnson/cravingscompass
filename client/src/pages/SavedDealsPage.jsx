import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { clearSavedDeals, getDealById, getRestaurantById, getSavedDeals, removeSavedDeal } from '../lib/api'

function SavedDealsPage() {
  const { user, profileStatus } = useAuth() || {}
  const userId = user?.id

  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [dealById, setDealById] = useState({})
  const [restaurantById, setRestaurantById] = useState({})
  const [busyId, setBusyId] = useState(null)
  const [clearing, setClearing] = useState(false)

  async function load() {
    if (!userId) return
    setStatus('loading')
    setError(null)
    try {
      const data = await getSavedDeals(userId)
      setItems(Array.isArray(data) ? data : [])
      setStatus('success')
    } catch (e) {
      setError(e)
      setStatus('error')
    }
  }

  const dealIds = useMemo(() => {
    const ids = new Set()
    for (const row of items) {
      if (row?.deal_id) ids.add(row.deal_id)
    }
    return Array.from(ids)
  }, [items])

  useEffect(() => {
    let mounted = true

    async function hydrateDeals() {
      if (dealIds.length === 0) return
      const missing = dealIds.filter((id) => !dealById[id])
      if (missing.length === 0) return

      try {
        const results = await Promise.all(
          missing.map(async (id) => {
            try {
              const d = await getDealById(id)
              return [id, d]
            } catch {
              return [id, null]
            }
          })
        )

        if (!mounted) return
        setDealById((prev) => {
          const next = { ...prev }
          for (const [id, d] of results) next[id] = d
          return next
        })
      } catch {
        // ignore hydration errors; base list still works
      }
    }

    hydrateDeals()
    return () => {
      mounted = false
    }
  }, [dealIds, dealById])

  const restaurantIds = useMemo(() => {
    const ids = new Set()
    for (const id of dealIds) {
      const d = dealById[id]
      const rid = d?.restaurant_id
      if (rid) ids.add(rid)
    }
    return Array.from(ids)
  }, [dealIds, dealById])

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

  useEffect(() => {
    if (profileStatus === 'ready') load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, profileStatus])

  async function handleRemove(dealId) {
    if (!userId) return
    setBusyId(dealId)
    setError(null)
    try {
      await removeSavedDeal(userId, dealId)
      await load()
    } catch (e) {
      setError(e)
    } finally {
      setBusyId(null)
    }
  }

  async function handleClear() {
    if (!userId) return
    setClearing(true)
    setError(null)
    try {
      await clearSavedDeals(userId)
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
        <h2>Your saved list</h2>
        <div className="card">
          <div className="actions" style={{ marginBottom: 12 }}>
            <button type="button" className="btn" onClick={load} disabled={status === 'loading'}>
              Refresh
            </button>
            <button type="button" className="btn" onClick={handleClear} disabled={clearing || items.length === 0}>
              {clearing ? 'Clearing…' : 'Clear all'}
            </button>
          </div>

          {profileStatus === 'loading' ? <p className="muted">Preparing your profile…</p> : null}
          {status === 'loading' ? <p className="muted">Loading…</p> : null}
          {status === 'error' ? <p className="muted">{error?.message || 'Failed to load saved deals'}</p> : null}
          {status === 'success' && items.length === 0 ? <p className="muted">No saved deals yet.</p> : null}

          {items.length > 0 ? (
            <div className="list">
              {items.map((row) => {
                const dealId = row?.deal_id
                const embeddedDeal = row?.deal || null
                const deal = embeddedDeal || (dealId ? dealById[dealId] : null)
                const rid = embeddedDeal?.restaurant_id || deal?.restaurant_id
                const embeddedRestaurant = embeddedDeal?.restaurant || null
                const restaurant = embeddedRestaurant || (rid ? restaurantById[rid] : null)

                const title = deal?.title || 'Deal'
                const restaurantName = restaurant?.name || (rid ? `Restaurant ${rid.slice(0, 8)}…` : null)
                const price = deal?.price != null ? `$${Number(deal.price).toFixed(2)}` : null
                return (
                  <div key={row?.saved_deal_id || dealId} className="list-row">
                    <div>
                      <div className="row-title">{title}</div>
                      <div className="row-meta">
                        {restaurantName ? `${restaurantName} · ` : ''}
                        {price ? `${price} · ` : ''}
                      </div>
                    </div>
                    <div className="actions">
                      {dealId ? (
                        <Link className="btn btn--primary" to={`/deals/${dealId}`}>
                          View
                        </Link>
                      ) : null}
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleRemove(dealId)}
                        disabled={!dealId || busyId === dealId}
                      >
                        {busyId === dealId ? 'Removing…' : 'Remove'}
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </section>
    </div>
  )
}

export default SavedDealsPage
