import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDeals } from '../lib/api'

function SearchResultsPage() {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('best_value')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [deals, setDeals] = useState([])

  useEffect(() => {
    let mounted = true
    async function load() {
      setStatus('loading')
      setError(null)
      try {
        const data = await getDeals({ query: query.trim() || undefined, sort })
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
  }, [query, sort])

  const results = useMemo(() => deals, [deals])

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
            </label>
          </div>
          <p className="muted">Search updates as you type.</p>
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
              return (
                <div key={id || `${deal?.title}-${Math.random()}`} className="list-row">
                  <div>
                    <div className="row-title">{getDealTitle(deal)}</div>
                    <div className="row-meta">{getDealMeta(deal)}</div>
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
