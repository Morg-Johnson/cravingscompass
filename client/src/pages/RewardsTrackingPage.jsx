import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import {
  changeRewardPoints,
  createRewardAccount,
  createRewardTransaction,
  deleteRewardAccount,
  getRewardTransactions,
  getRewards,
  getRestaurantById,
  getRestaurants,
} from '../lib/api'

function RewardsTrackingPage() {
  const { user, profileStatus } = useAuth() || {}
  const userId = user?.id

  const [status, setStatus] = useState('idle')
  const [error, setError] = useState(null)
  const [accounts, setAccounts] = useState([])

  const [restaurantsStatus, setRestaurantsStatus] = useState('idle')
  const [restaurants, setRestaurants] = useState([])
  const [restaurantById, setRestaurantById] = useState({})

  const [txStatus, setTxStatus] = useState('idle')
  const [txError, setTxError] = useState(null)
  const [transactions, setTransactions] = useState([])

  const [restaurantId, setRestaurantId] = useState('')
  const [startingPoints, setStartingPoints] = useState('100')
  const [busyRestaurantId, setBusyRestaurantId] = useState(null)

  const [rewardAccountId, setRewardAccountId] = useState('')
  const [pointsChange, setPointsChange] = useState('10')
  const [txType, setTxType] = useState('earn')
  const [creatingTx, setCreatingTx] = useState(false)

  async function loadAccounts() {
    if (!userId) return
    setStatus('loading')
    setError(null)
    try {
      const data = await getRewards(userId)
      setAccounts(Array.isArray(data) ? data : [])
      setStatus('success')
    } catch (e) {
      setError(e)
      setStatus('error')
    }
  }

  async function loadTransactions() {
    setTxStatus('loading')
    setTxError(null)
    try {
      const data = await getRewardTransactions()
      setTransactions(Array.isArray(data) ? data : [])
      setTxStatus('success')
    } catch (e) {
      setTxError(e)
      setTxStatus('error')
    }
  }

  useEffect(() => {
    if (profileStatus === 'ready') {
      loadAccounts()
      loadTransactions()
    }
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

  useEffect(() => {
    let mounted = true

    async function hydrateRestaurantNames() {
      const ids = new Set()
      for (const a of accounts) {
        if (a?.restaurant_id) ids.add(a.restaurant_id)
      }
      const missing = Array.from(ids).filter((id) => !restaurantById[id])
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

    hydrateRestaurantNames()

    return () => {
      mounted = false
    }
  }, [accounts, restaurantById])

  async function handleCreateAccount() {
    if (!userId) return
    const rid = restaurantId.trim()
    if (!rid) return
    setBusyRestaurantId(rid)
    setError(null)
    try {
      const points = Number(startingPoints)
      await createRewardAccount(userId, rid, Number.isFinite(points) ? points : 0)
      setRestaurantId('')
      await loadAccounts()
    } catch (e) {
      setError(e)
    } finally {
      setBusyRestaurantId(null)
    }
  }

  async function handleChangePoints(rid, delta) {
    if (!userId) return
    setBusyRestaurantId(rid)
    setError(null)
    try {
      await changeRewardPoints(userId, rid, delta)
      await loadAccounts()
    } catch (e) {
      setError(e)
    } finally {
      setBusyRestaurantId(null)
    }
  }

  async function handleDeleteAccount(rid) {
    if (!userId) return
    setBusyRestaurantId(rid)
    setError(null)
    try {
      await deleteRewardAccount(userId, rid)
      await loadAccounts()
    } catch (e) {
      setError(e)
    } finally {
      setBusyRestaurantId(null)
    }
  }

  async function handleCreateTransaction() {
    const aid = rewardAccountId.trim()
    if (!aid) return
    setCreatingTx(true)
    setTxError(null)
    try {
      const delta = Number(pointsChange)
      await createRewardTransaction({
        reward_account_id: aid,
        points_change: Number.isFinite(delta) ? delta : 0,
        transaction_type: txType || null,
      })
      await loadTransactions()
    } catch (e) {
      setTxError(e)
    } finally {
      setCreatingTx(false)
    }
  }

  return (
    <div className="page">
      <section className="section">
        <h2>Reward accounts</h2>
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
            <label className="label">
              Starting points
              <input
                className="input"
                value={startingPoints}
                onChange={(e) => setStartingPoints(e.target.value)}
                disabled={status === 'loading'}
              />
            </label>
          </div>

          <div className="actions" style={{ marginBottom: 12 }}>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleCreateAccount}
              disabled={!restaurantId.trim() || busyRestaurantId === restaurantId.trim()}
            >
              Create account
            </button>
            <button type="button" className="btn" onClick={loadAccounts} disabled={status === 'loading'}>
              Refresh
            </button>
          </div>

          {profileStatus === 'loading' ? <p className="muted">Preparing your profile…</p> : null}
          {status === 'loading' ? <p className="muted">Loading…</p> : null}
          {status === 'error' ? <p className="muted">{error?.message || 'Failed to load rewards'}</p> : null}
          {status === 'success' && accounts.length === 0 ? <p className="muted">No reward accounts yet.</p> : null}

          {accounts.length > 0 ? (
            <div className="list">
              {accounts.map((row) => {
                const rid = row?.restaurant_id
                const r = rid ? restaurantById[rid] : null
                const name = r?.name || 'Restaurant'
                return (
                  <div key={row?.reward_account_id || rid} className="list-row">
                    <div>
                      <div className="row-title">{name}</div>
                      <div className="row-meta">
                        {row?.points_balance ?? 0} points
                      </div>
                    </div>
                    <div className="actions">
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleChangePoints(rid, 25)}
                        disabled={!rid || busyRestaurantId === rid}
                      >
                        +25
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleChangePoints(rid, -25)}
                        disabled={!rid || busyRestaurantId === rid}
                      >
                        -25
                      </button>
                      <button
                        type="button"
                        className="btn"
                        onClick={() => handleDeleteAccount(rid)}
                        disabled={!rid || busyRestaurantId === rid}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : null}
        </div>
      </section>

      <section className="section">
        <h2>Transaction history</h2>
        <div className="card">
          <div className="form-row">
            <label className="label">
              Reward account
              <select
                className="input"
                value={rewardAccountId}
                onChange={(e) => setRewardAccountId(e.target.value)}
                disabled={txStatus === 'loading'}
              >
                <option value="">Select an account…</option>
                {accounts.map((a) => {
                  const rid = a?.restaurant_id
                  const name = restaurantById[rid]?.name || 'Restaurant'
                  return (
                    <option key={a.reward_account_id} value={a.reward_account_id}>
                      {name} ({a.points_balance ?? 0} pts)
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="label">
              Points change
              <input
                className="input"
                value={pointsChange}
                onChange={(e) => setPointsChange(e.target.value)}
                disabled={txStatus === 'loading'}
              />
            </label>
          </div>
          <div className="form-row">
            <label className="label">
              Type
              <select className="input" value={txType} onChange={(e) => setTxType(e.target.value)}>
                <option value="earn">earn</option>
                <option value="redeem">redeem</option>
                <option value="adjustment">adjustment</option>
              </select>
            </label>
            <div className="actions" style={{ alignItems: 'end' }}>
              <button type="button" className="btn btn--primary" onClick={handleCreateTransaction} disabled={creatingTx || !rewardAccountId.trim()}>
                {creatingTx ? 'Creating…' : 'Create transaction'}
              </button>
              <button type="button" className="btn" onClick={loadTransactions} disabled={txStatus === 'loading'}>
                Refresh
              </button>
            </div>
          </div>

          {txStatus === 'loading' ? <p className="muted">Loading…</p> : null}
          {txStatus === 'error' ? <p className="muted">{txError?.message || 'Failed to load transactions'}</p> : null}
          {txStatus === 'success' && transactions.length === 0 ? <p className="muted">No transactions yet.</p> : null}

          {transactions.length > 0 ? (
            <div className="list">
              {transactions.slice(0, 20).map((row) => (
                <div key={row?.reward_transaction_id} className="list-row">
                  <div>
                    <div className="row-title">{row?.transaction_type || 'transaction'}</div>
                    <div className="row-meta">
                      {row?.points_change} points ·{' '}
                      {String(row?.transaction_timestamp || '').slice(0, 19).replace('T', ' ')}
                    </div>
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

export default RewardsTrackingPage
