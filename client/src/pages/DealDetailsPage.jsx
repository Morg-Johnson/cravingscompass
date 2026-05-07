import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getDealById, getRestaurantById, saveDeal } from '../lib/api'
import { useAuth } from '../auth/AuthContext'

function DealDetailsPage() {
  const { dealId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth() || {}
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [deal, setDeal] = useState(null)
  const [restaurant, setRestaurant] = useState(null)
  const [saving, setSaving] = useState(false)
  const [actionError, setActionError] = useState(null)
  const [saved, setSaved] = useState(false)

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

  useEffect(() => {
    let mounted = true
    async function loadRestaurant() {
      const rid = deal?.restaurant_id
      if (!rid) {
        setRestaurant(null)
        return
      }
      try {
        const data = await getRestaurantById(rid)
        if (!mounted) return
        setRestaurant(data)
      } catch {
        if (!mounted) return
        setRestaurant(null)
      }
    }

    loadRestaurant()
    return () => {
      mounted = false
    }
  }, [deal?.restaurant_id])

  const title = deal?.title || deal?.name || `Deal ${dealId}`
  const restaurantName = restaurant?.name || null
  const logoUrl =
    restaurant?.logo_url ||
    restaurant?.logo ||
    restaurant?.image_url ||
    restaurant?.image ||
    restaurant?.photo_url ||
    null
  const price = deal?.price != null ? `$${Number(deal.price).toFixed(2)}` : '—'
  const calories =
    deal?.calories != null && Number.isFinite(Number(deal.calories)) ? `${Number(deal.calories)} cal` : '—'
  const valueScore = deal?.value_score != null ? String(deal.value_score) : '—'
  const exp = deal?.expiration_time || deal?.expires_at
  const expiration = exp ? String(exp).slice(0, 10) : '—'

  async function handleSave() {
    if (!dealId) return
    if (!user?.id) {
      navigate('/account', { replace: true, state: { from: `/deals/${dealId}` } })
      return
    }

    setActionError(null)
    setSaving(true)
    try {
      await saveDeal(user.id, dealId)
      setSaved(true)
    } catch (e) {
      setActionError(e)
    } finally {
      setSaving(false)
    }
  }

  function handleCompare() {
    if (!dealId) return
    try {
      localStorage.setItem('compareDealIds', JSON.stringify([String(dealId), null]))
    } catch {
      // ignore
    }
    navigate('/compare')
  }

  return (
    <div className="page">
      <section className="section">
        <h2>Summary</h2>
        <div className="card">
          {status === 'loading' ? <p className="muted">Loading…</p> : null}
          {status === 'error' ? (
            <p className="muted">{error?.message || 'Failed to load deal'}</p>
          ) : null}

          {status === 'success' ? (
            <div className="list-row" style={{ marginBottom: 12 }}>
              <div className="deal-row__left">
                {logoUrl ? (
                  <img className="deal-logo" src={logoUrl} alt="" loading="lazy" />
                ) : (
                  <div className="deal-logo deal-logo--placeholder" aria-hidden="true">
                    {String(restaurantName || '?').slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="row-title">{restaurantName || title}</div>
                  <div className="row-meta">{restaurantName ? title : null}</div>
                </div>
              </div>
            </div>
          ) : null}

          <div className="kv">
            <div>
              <div className="kv-label">Price</div>
              <div className="kv-value">{price}</div>
            </div>
            <div>
              <div className="kv-label">Calories</div>
              <div className="kv-value">{calories}</div>
            </div>
            <div>
              <div className="kv-label">Value</div>
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
          {actionError ? <p className="muted">{actionError?.message || 'Action failed'}</p> : null}
          {saved ? <p className="muted">Saved.</p> : null}
          <button type="button" className="btn btn--primary" onClick={handleSave} disabled={saving || !dealId}>
            {saving ? 'Saving…' : 'Save Deal'}
          </button>
          <button type="button" className="btn" onClick={handleCompare} disabled={!dealId}>
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
