import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { getDeals, getFavorites, getRestaurants } from '../lib/api'

function SearchResultsPage() {
  const { user, profileStatus } = useAuth() || {}
  const userId = user?.id

  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('best_value')
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [deals, setDeals] = useState([])
  const [restaurantsById, setRestaurantsById] = useState({})
  const [favoriteRestaurantIds, setFavoriteRestaurantIds] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setStatus('loading')
      setError(null)
      try {
        const [dealData, restaurantData] = await Promise.all([
          getDeals({ query: query.trim() || undefined, sort }),
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
  }, [query, sort])

  useEffect(() => {
    let mounted = true
    async function loadFavorites() {
      if (!userId) {
        setFavoriteRestaurantIds([])
        return
      }
      if (profileStatus !== 'ready') return
      try {
        const data = await getFavorites(userId)
        if (!mounted) return
        const ids = Array.isArray(data)
          ? data.map((row) => row?.restaurant_id).filter(Boolean)
          : []
        setFavoriteRestaurantIds(ids)
      } catch {
        if (!mounted) return
        setFavoriteRestaurantIds([])
      }
    }

    loadFavorites()
    return () => {
      mounted = false
    }
  }, [profileStatus, userId])

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

  const results = useMemo(() => {
    const q = String(query || '').trim().toLowerCase()
    const tokens = q ? q.split(/\s+/).filter(Boolean) : []

    const calorieIntent =
      q.includes('low cal') ||
      q.includes('low-cal') ||
      q.includes('low calorie') ||
      q.includes('low-calorie') ||
      (tokens.includes('low') && (tokens.includes('cal') || tokens.includes('calorie') || tokens.includes('calories')))

    const textTokens = calorieIntent
      ? tokens.filter((t) => t !== 'low' && t !== 'cal' && t !== 'calorie' && t !== 'calories')
      : tokens

    function getRestaurantForDeal(deal) {
      const rid = deal?.restaurant_id
      if (!rid) return null
      return restaurantsById[rid] || null
    }

    function getRelevanceScore(deal) {
      if (textTokens.length === 0 && !calorieIntent) return 0

      const title = String(deal?.title || deal?.name || '').toLowerCase()
      const restaurantName = String(getRestaurantForDeal(deal)?.name || '').toLowerCase()
      const calories = Number(deal?.calories)

      let score = 0
      for (const t of textTokens) {
        if (!t) continue
        if (title.startsWith(t)) score += 20
        if (restaurantName.startsWith(t)) score += 12
        if (title.includes(t)) score += 10
        if (restaurantName.includes(t)) score += 6
      }

      if (calorieIntent) {
        if (Number.isFinite(calories)) {
          // Prefer lower-calorie items. The constants here are just to create a smooth ordering.
          // Lower calories -> higher score.
          score += Math.max(0, 1200 - calories) / 10
          if (calories <= 600) score += 25
          if (calories <= 400) score += 15
        } else {
          // If calories aren't provided, deprioritize for low-cal searches.
          score -= 50
        }
      }
      return score
    }

    const favoritesSet = new Set(favoriteRestaurantIds.map(String))
    const base = deals
      .filter(hasMenuItemTitle)
      .filter((d) => {
        if (!favoritesOnly) return true
        const rid = d?.restaurant_id
        if (!rid) return false
        return favoritesSet.has(String(rid))
      })

    if (textTokens.length === 0 && !calorieIntent) return base

    // Highest relevance first; preserve original order for ties.
    return base
      .map((d, idx) => ({ d, idx, score: getRelevanceScore(d) }))
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        // For low-calorie searches, break ties by lower calories.
        if (calorieIntent) {
          const ac = Number(a.d?.calories)
          const bc = Number(b.d?.calories)
          const aHas = Number.isFinite(ac)
          const bHas = Number.isFinite(bc)
          if (aHas && bHas && ac !== bc) return ac - bc
          if (aHas !== bHas) return aHas ? -1 : 1
        }
        return a.idx - b.idx
      })
      .map((x) => x.d)
  }, [deals, favoritesOnly, favoriteRestaurantIds, query, restaurantsById])

  function getDealId(deal) {
    return deal?.deal_id || deal?.id
  }

  function getDealTitle(deal) {
    return deal?.title || deal?.name || 'Untitled deal'
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

  return (
    <div className="page">
      <section className="section">
        <h2>Search controls</h2>
        <div className="card">
          <div className="form-row">
            <label className="label">
              Keyword
              <input
                className="input"
                placeholder="tacos, burger, low cal..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
            <label className="label">
              Sort
              <select className="input" value={sort} onChange={(e) => setSort(e.target.value)}>
                <option value="best_value">Best value</option>
                <option value="price_asc">Lowest price</option>
              </select>

              <label className="label" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
                <input
                  type="checkbox"
                  checked={favoritesOnly}
                  onChange={(e) => setFavoritesOnly(e.target.checked)}
                  disabled={!userId || profileStatus !== 'ready'}
                />
                Favorites only
              </label>
            </label>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Results</h2>
        {status === 'loading' ? <p className="muted">Loading…</p> : null}
        {status === 'error' ? (
          <p className="muted">{error?.message || 'Failed to load results'}</p>
        ) : null}
        {status === 'success' && results.length === 0 ? (
          <p className="muted">No results.</p>
        ) : null}

        {results.length > 0 ? (
          <div className="list">
            {results.map((deal) => {
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
                      <div className="row-title">{restaurant?.name || dealTitle}</div>
                      <div className="row-meta">{metaParts.join(' · ')}</div>
                    </div>
                  </div>
                  {id ? (
                    <Link className="btn btn--primary" to={`/deals/${id}`}>
                      Details
                    </Link>
                  ) : (
                    <button type="button" className="btn" disabled>
                      Details
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : null}
      </section>
    </div>
  )
}

export default SearchResultsPage
