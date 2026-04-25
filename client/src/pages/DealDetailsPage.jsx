import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getDealById } from '../lib/api'

function DealDetailsPage() {
  const { dealId } = useParams()
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [deal, setDeal] = useState(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      setStatus('loading')
      setError(null)
      try {
        const data = await getDealById(dealId)
        if (!mounted) return
        setDeal(data)
        setStatus('success')
      } catch (e) {
        if (!mounted) return
        setError(e)
        setStatus('error')
      }
    }

    if (dealId) load()
    return () => {
      mounted = false
    }
  }, [dealId])

  const title = deal?.title || deal?.name || `Deal ${dealId}`
  const price = deal?.price != null ? `$${Number(deal.price).toFixed(2)}` : '—'
  const valueScore = deal?.value_score != null ? String(deal.value_score) : '—'
  const exp = deal?.expiration_time || deal?.expires_at
  const expiration = exp ? String(exp).slice(0, 10) : '—'

  return (
    <div className="page">
      <section className="section">
        <h2>Summary</h2>
        <div className="card">
          {status === 'loading' ? <p className="muted">Loading…</p> : null}
          {status === 'error' ? (
            <p className="muted">{error?.message || 'Failed to load deal'}</p>
          ) : null}
          <div className="kv">
            <div>
              <div className="kv-label">Price</div>
              <div className="kv-value">{price}</div>
            </div>
            <div>
              <div className="kv-label">Value Score</div>
              <div className="kv-value">{valueScore}</div>
            </div>
            <div>
              <div className="kv-label">Expiration</div>
              <div className="kv-value">{expiration}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Actions</h2>
        <div className="card actions">
          <button type="button" className="btn btn--primary" disabled>
            Save Deal
          </button>
          <button type="button" className="btn" disabled>
            Compare
          </button>
          <Link className="btn" to="/search">
            Back to search
          </Link>
        </div>
      </section>
    </div>
  )
}

export default DealDetailsPage
