import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDeals, getRestaurants } from '../lib/api'

function HomePage() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [deals, setDeals] = useState([])
  const [restaurantsById, setRestaurantsById] = useState({})
  const [compareIds, setCompareIds] = useState([null, null])

  useEffect(() => {
    let mounted = true
    async function load() {
      setStatus('loading')
      setError(null)
      try {
        const [dealData, restaurantData] = await Promise.all([
          getDeals({ sort: 'best_value' }),
          getRestaurants(),
        ])
        if (!mounted) return
        setDeals(Array.isArray(dealData) ? dealData : [])
        const list = Array.isArray(restaurantData) ? restaurantData : []
        const byId = {}
        for (const r of list) {
          const id = r?.restaurant_id || r?.id
          if (id) byId[id] = r
        }
        setRestaurantsById(byId)
        setStatus('success')
      } catch (e) {
        if (!mounted) return
        setError(e)
        setStatus('error')
      }
    }

    load()
    return () => {
      mounted = false
    }
  }, [])

  function hasMenuItemTitle(deal) {
    const raw = String(deal?.title || deal?.name || '').trim()
    if (!raw) return false
    const lowered = raw.toLowerCase()
    if (lowered === 'untitled deal') return false
    if (lowered === 'best deal') return false
    if (lowered === 'great deal') return false
    if (lowered === 'good deal') return false
    if (lowered.includes('curl deal test')) return false
    if (lowered.includes('test deal')) return false
    return true
  }

  const topDeals = useMemo(() => {
    const selected = new Set(compareIds.filter(Boolean).map(String))
    return deals
      .filter(hasMenuItemTitle)
      .filter((d) => {
        const id = getDealId(d)
        if (!id) return true
        return !selected.has(String(id))
      })
      .slice(0, 16)
  }, [compareIds, deals])

  function getDealId(deal) {
    return deal?.deal_id || deal?.id
  }

  function getDealTitle(deal) {
    return deal?.title || deal?.name || 'Untitled deal'
  }

  function getPrimaryDealTitle(deal) {
    const restaurant = getRestaurantForDeal(deal)
    return restaurant?.name || getDealTitle(deal)
  }

  function getDealMeta(deal) {
    const price = deal?.price != null ? `$${Number(deal.price).toFixed(2)}` : null
    const calories =
      deal?.calories != null && Number.isFinite(Number(deal.calories)) ? `${Number(deal.calories)} cal` : null
    const value = deal?.value_score != null ? `Value ${deal.value_score}` : null
    const exp = deal?.expiration_time || deal?.expires_at
    const expText = exp ? `Expires ${String(exp).slice(0, 10)}` : null
    return [price, calories, value, expText].filter(Boolean).join(' · ')
  }

  function getRestaurantForDeal(deal) {
    const rid = deal?.restaurant_id
    if (!rid) return null
    return restaurantsById[rid] || null
  }

  function getRestaurantLogoUrl(restaurant) {
    if (!restaurant) return null
    return (
      restaurant?.logo_url ||
      restaurant?.logo ||
      restaurant?.image_url ||
      restaurant?.image ||
      restaurant?.photo_url ||
      null
    )
  }

  function getDealQuality(deal) {
    const score = Number(deal?.value_score)
    if (!Number.isFinite(score)) return 'good'
    if (score >= 8) return 'best'
    if (score >= 6) return 'great'
    return 'good'
  }

  function handleDragStart(e, deal) {
    const id = getDealId(deal)
    if (!id) return
    e.dataTransfer.setData('text/plain', String(id))
    e.dataTransfer.effectAllowed = 'copy'
  }

  function allowDrop(e) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
  }

  function handleDrop(slotIndex, e) {
    e.preventDefault()
    const dealId = e.dataTransfer.getData('text/plain')
    if (!dealId) return

    setCompareIds((prev) => {
      const next = [...prev]
      next[slotIndex] = dealId
      return next
    })
  }

  function clearSlot(slotIndex) {
    setCompareIds((prev) => {
      const next = [...prev]
      next[slotIndex] = null
      return next
    })
  }

  const dealsById = useMemo(() => {
    const byId = {}
    for (const d of deals) {
      const id = getDealId(d)
      if (id) byId[id] = d
    }
    return byId
  }, [deals])

  return (
    <div className="page">
      <section className="section">
        <h2>Top Deals</h2>
        <div className="card">
          {status === 'loading' ? <p className="muted">Loading deals…</p> : null}
          {status === 'error' ? (
            <p className="muted">{error?.message || 'Failed to load deals'}</p>
          ) : null}
          {status === 'success' && topDeals.length === 0 ? (
            <p className="muted">No deals yet.</p>
          ) : null}

          {topDeals.length > 0 ? (
            <div className="list">
              {topDeals.map((deal) => {
                const id = getDealId(deal)
                const restaurant = getRestaurantForDeal(deal)
                const logoUrl = getRestaurantLogoUrl(restaurant)
                const quality = getDealQuality(deal)
                const dealTitle = getDealTitle(deal)
                const metaParts = [restaurant?.name ? dealTitle : null, getDealMeta(deal)].filter(Boolean)
                return (
                  <div
                    key={id || `${deal?.title}-${Math.random()}`}
                    className={`list-row deal-row deal-row--${quality}`}
                    draggable={Boolean(id)}
                    onDragStart={(e) => handleDragStart(e, deal)}
                  >
                    <div className="deal-row__left">
                      {logoUrl ? (
                        <img className="deal-logo" src={logoUrl} alt="" loading="lazy" />
                      ) : (
                        <div className="deal-logo deal-logo--placeholder" aria-hidden="true">
                          {String(restaurant?.name || '?').slice(0, 1).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="row-title">{getPrimaryDealTitle(deal)}</div>
                        <div className="row-meta">{metaParts.join(' · ')}</div>
                      </div>
                    </div>
                    {id ? (
                      <Link className="btn btn--primary" to={`/deals/${id}`}>
                        View
                      </Link>
                    ) : (
                      <button type="button" className="btn" disabled>
                        View
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section">
        <h2>Compare</h2>
        <div className="card">
          <div className="compare-grid">
            {[0, 1].map((slotIndex) => {
              const dealId = compareIds[slotIndex]
              const deal = dealId ? dealsById[dealId] : null
              const restaurant = deal ? getRestaurantForDeal(deal) : null
              const logoUrl = deal ? getRestaurantLogoUrl(restaurant) : null
              const quality = deal ? getDealQuality(deal) : 'good'
              return (
                <div
                  key={slotIndex}
                  className={`compare-slot ${deal ? `compare-slot--filled deal-row--${quality}` : ''}`}
                  onDragOver={allowDrop}
                  onDrop={(e) => handleDrop(slotIndex, e)}
                >
                  {deal ? (
                    <div className="compare-slot__content">
                      <div className="deal-row__left">
                        {logoUrl ? (
                          <img className="deal-logo" src={logoUrl} alt="" loading="lazy" />
                        ) : (
                          <div className="deal-logo deal-logo--placeholder" aria-hidden="true">
                            {String(restaurant?.name || '?').slice(0, 1).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="row-title">{restaurant?.name || getDealTitle(deal)}</div>
                          <div className="row-meta">
                            {[restaurant?.name ? getDealTitle(deal) : null, getDealMeta(deal)].filter(Boolean).join(' · ')}
                          </div>
                        </div>
                      </div>
                      <div className="actions">
                        <Link className="btn btn--primary" to={`/deals/${getDealId(deal)}`}>
                          View
                        </Link>
                        <button type="button" className="btn" onClick={() => clearSlot(slotIndex)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="compare-slot__empty">
                      <div className="row-title">Drop a deal here</div>
                      <div className="row-meta">Drag from Top Deals</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="actions" style={{ marginTop: 12 }}>
            <Link className="btn btn--primary" to="/compare">
              Open full compare
            </Link>
            <button type="button" className="btn" onClick={() => setCompareIds([null, null])}>
              Clear
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
