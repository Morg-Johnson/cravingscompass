import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { getDeals, getRestaurants } from '../lib/api'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

function RouteBasedDealsPage() {
  const mapElRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const userInteractedRef = useRef(false)
  const lastBoundsHashRef = useRef('')
  const markerBoundsRef = useRef([])

  const [dataStatus, setDataStatus] = useState('idle')
  const [dataError, setDataError] = useState(null)
  const [deals, setDeals] = useState([])
  const [restaurantsById, setRestaurantsById] = useState({})
  const [geoStatus, setGeoStatus] = useState('idle')
  const [geoError, setGeoError] = useState(null)
  const [restaurantLatLngById, setRestaurantLatLngById] = useState({})

  useEffect(() => {
    let mounted = true
    async function loadData() {
      setDataStatus('loading')
      setDataError(null)
      try {
        const [dealData, restaurantData] = await Promise.all([
          getDeals({ sort: 'best_value' }),
          getRestaurants(),
        ])
        if (!mounted) return
        setDeals(Array.isArray(dealData) ? dealData : [])

        const map = {}
        for (const r of Array.isArray(restaurantData) ? restaurantData : []) {
          if (r?.restaurant_id) map[r.restaurant_id] = r
        }
        setRestaurantsById(map)
        setDataStatus('success')
      } catch (e) {
        if (!mounted) return
        setDataError(e)
        setDataStatus('error')
      }
    }

    loadData()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function initLeaflet() {
      if (mapRef.current) return
      if (!mapElRef.current) return

      try {
        const L = await import('leaflet')
        await import('leaflet.markercluster/dist/leaflet.markercluster.js')
        if (cancelled) return

        try {
          delete L.Icon.Default.prototype._getIconUrl
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: markerIcon2x,
            iconUrl: markerIcon,
            shadowUrl: markerShadow,
          })
        } catch {
          // ignore
        }

        const map = L.map(mapElRef.current, {
          zoomControl: true,
        }).setView([39.7285, -121.8375], 13)

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap contributors',
          maxZoom: 19,
        }).addTo(map)

        const layer = L.markerClusterGroup({
          showCoverageOnHover: false,
          maxClusterRadius: 44,
        }).addTo(map)
        mapRef.current = map
        layerRef.current = layer

        map.on('zoomstart', () => {
          userInteractedRef.current = true
        })
        map.on('dragstart', () => {
          userInteractedRef.current = true
        })
      } catch (e) {
        setGeoStatus('error')
        setGeoError(e)
      }
    }

    initLeaflet()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function geocodeRestaurants() {
      if (dataStatus !== 'success') return
      const entries = Object.entries(restaurantsById)
      if (entries.length === 0) return

      setGeoStatus('loading')
      setGeoError(null)

      const next = {}

      for (const [rid, r] of entries) {
        const address = String(r?.location_address || '').trim()
        if (!address) continue

        const cacheKey = `cc:nominatim:${rid}:${address}`
        try {
          const cached = localStorage.getItem(cacheKey)
          if (cached) {
            const parsed = JSON.parse(cached)
            if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
              next[rid] = { lat: parsed.lat, lng: parsed.lng }
              continue
            }
          }
        } catch {
          // ignore
        }

        try {
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`
          const res = await fetch(url, {
            headers: {
              'Accept': 'application/json',
            },
          })
          const json = await res.json().catch(() => null)
          const row = Array.isArray(json) ? json[0] : null
          const lat = row?.lat != null ? Number(row.lat) : NaN
          const lng = row?.lon != null ? Number(row.lon) : NaN
          if (Number.isFinite(lat) && Number.isFinite(lng)) {
            next[rid] = { lat, lng }
            try {
              localStorage.setItem(cacheKey, JSON.stringify({ lat, lng }))
            } catch {
              // ignore
            }
          }
        } catch {
          // ignore individual failures
        }
      }

      if (!mounted) return
      setRestaurantLatLngById(next)
      setGeoStatus('success')
    }

    geocodeRestaurants()
    return () => {
      mounted = false
    }
  }, [dataStatus, restaurantsById])

  const dealsInChico = useMemo(() => {
    return deals.filter((d) => d?.restaurant_id)
  }, [deals])

  const restaurantsWithDeals = useMemo(() => {
    const ids = new Set(dealsInChico.map((d) => String(d.restaurant_id)))
    return Array.from(ids)
  }, [dealsInChico])

  useEffect(() => {
    async function renderMarkers() {
      const map = mapRef.current
      const layer = layerRef.current
      if (!map || !layer) return

      const L = await import('leaflet')

      layer.clearLayers()

      const bounds = []

      for (const rid of restaurantsWithDeals) {
        const loc = restaurantLatLngById[rid]
        if (!loc) continue
        const r = restaurantsById[rid]
        const dealsForRestaurant = dealsInChico.filter((d) => String(d.restaurant_id) === String(rid))
        const topDeals = dealsForRestaurant.slice(0, 3)

        const popupHtml = `
          <div style="min-width:220px">
            <div style="font-weight:600; margin-bottom:6px">${String(r?.name || 'Restaurant')}</div>
            <div style="font-size:12px; opacity:0.8; margin-bottom:8px">${String(r?.location_address || '')}</div>
            ${topDeals
              .map((d) => {
                const title = String(d?.title || d?.name || 'Deal')
                const price = d?.price != null ? `$${Number(d.price).toFixed(2)}` : ''
                const cals = d?.calories != null && Number.isFinite(Number(d.calories)) ? `${Number(d.calories)} cal` : ''
                return `<div style=\"margin-bottom:6px\"><div style=\"font-weight:500\">${title}</div><div style=\"font-size:12px; opacity:0.85\">${[price, cals].filter(Boolean).join(' · ')}</div></div>`
              })
              .join('')}
          </div>
        `.trim()

        const marker = L.marker([loc.lat, loc.lng])
        marker.bindPopup(popupHtml)
        marker.addTo(layer)
        bounds.push([loc.lat, loc.lng])
      }

      if (bounds.length > 0) {
        markerBoundsRef.current = bounds
        const hash = bounds
          .map((b) => `${Number(b[0]).toFixed(5)},${Number(b[1]).toFixed(5)}`)
          .sort()
          .join('|')
        const boundsChanged = hash !== lastBoundsHashRef.current
        const shouldAutoFit = !userInteractedRef.current && (boundsChanged || !lastBoundsHashRef.current)
        lastBoundsHashRef.current = hash
        if (shouldAutoFit) {
          map.fitBounds(bounds, { padding: [24, 24] })
        }
      }
    }

    renderMarkers()
  }, [dealsInChico, restaurantLatLngById, restaurantsById, restaurantsWithDeals])

  function getRestaurantForDeal(deal) {
    const rid = deal?.restaurant_id
    if (!rid) return null
    return restaurantsById[rid] || null
  }

  function getDealId(deal) {
    return deal?.deal_id || deal?.id
  }

  function getDealTitle(deal) {
    return deal?.title || deal?.name || 'Untitled deal'
  }

  function getPrimaryTitle(deal) {
    const r = getRestaurantForDeal(deal)
    return r?.name || getDealTitle(deal)
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

  return (
    <div className="page">
      <section className="section">
        <h2>Route Deals</h2>
        <div className="card">
          {dataStatus === 'error' ? <p className="muted">{dataError?.message || 'Failed to load deals'}</p> : null}
          {geoStatus === 'error' ? <p className="muted">{geoError?.message || 'Failed to load map'}</p> : null}

          <div className="route-map" ref={mapElRef} />

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
            <button
              type="button"
              className="btn"
              onClick={() => {
                const map = mapRef.current
                const bounds = markerBoundsRef.current
                if (!map || !bounds || bounds.length === 0) return
                map.fitBounds(bounds, { padding: [24, 24] })
              }}
            >
              Reset view
            </button>
          </div>
        </div>
      </section>

      <section className="section">
        <h2>Deals in Chico</h2>
        <div className="card">
          {dataStatus === 'loading' ? <p className="muted">Loading deals…</p> : null}

          {dataStatus === 'success' && dealsInChico.length === 0 ? <p className="muted">No deals found.</p> : null}

          {dealsInChico.length > 0 ? (
            <div className="list">
              {dealsInChico.map((deal) => {
                const dealId = getDealId(deal)
                const title = getPrimaryTitle(deal)
                const secondary = getDealTitle(deal)
                return (
                  <div key={dealId || secondary} className="list-row">
                    <div>
                      <div className="row-title">{title}</div>
                      <div className="row-meta">{title !== secondary ? `${secondary} · ` : ''}{getDealMeta(deal)}</div>
                    </div>
                    {dealId ? (
                      <div className="actions">
                        <Link className="btn" to={`/deals/${dealId}`}>
                          Details
                        </Link>
                      </div>
                    ) : null}
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

export default RouteBasedDealsPage
