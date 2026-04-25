import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDeals } from '../lib/api'

function HomePage() {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [deals, setDeals] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setStatus('loading')
      setError(null)
      try {
        const data = await getDeals({ sort: 'best_value' })
        if (!mounted) return
        setDeals(Array.isArray(data) ? data : [])
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

  const topDeals = useMemo(() => deals.slice(0, 8), [deals])

  function getDealId(deal) {
    return deal?.deal_id || deal?.id
  }

  function getDealTitle(deal) {
    return deal?.title || deal?.name || 'Untitled deal'
  }

  function getDealMeta(deal) {
    const price = deal?.price != null ? `$${Number(deal.price).toFixed(2)}` : null
    const value = deal?.value_score != null ? `Value ${deal.value_score}` : null
    const exp = deal?.expiration_time || deal?.expires_at
    const expText = exp ? `Expires ${String(exp).slice(0, 10)}` : null
    return [price, value, expText].filter(Boolean).join(' · ')
  }

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
                return (
                  <div key={id || `${deal?.title}-${Math.random()}`} className="list-row">
                    <div>
                      <div className="row-title">{getDealTitle(deal)}</div>
                      <div className="row-meta">{getDealMeta(deal)}</div>
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
        <h2>How it works</h2>
        <div className="grid">
          <div className="card">
            <div className="row-title">1) Find</div>
            <p className="muted">Search and filter deals based on your cravings.</p>
          </div>
          <div className="card">
            <div className="row-title">2) Compare</div>
            <p className="muted">Compare deals side-by-side to maximize value.</p>
          </div>
          <div className="card">
            <div className="row-title">3) Save</div>
            <p className="muted">Bookmark deals and favorite restaurants for later.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default HomePage
