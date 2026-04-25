import { API_BASE_URL } from './config'

async function request(path, options) {
  const url = `${API_BASE_URL}${path}`
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  })

  const contentType = res.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const body = isJson ? await res.json().catch(() => null) : await res.text().catch(() => '')

  if (!res.ok) {
    const message =
      (body && typeof body === 'object' && body.error && body.error.message) ||
      (typeof body === 'string' && body) ||
      `Request failed (${res.status})`
    const err = new Error(message)
    err.status = res.status
    err.data = body
    throw err
  }

  return body
}

export async function getDeals({ query, sort } = {}) {
  const params = new URLSearchParams()
  if (query) params.set('query', query)
  if (sort) params.set('sort', sort)
  const qs = params.toString() ? `?${params.toString()}` : ''
  return request(`/deals${qs}`)
}

export async function getDealById(dealId) {
  return request(`/deals/${encodeURIComponent(dealId)}`)
}

export async function getRestaurantById(restaurantId) {
  return request(`/restaurants/${encodeURIComponent(restaurantId)}`)
}

export async function getRestaurants() {
  return request('/restaurants')
}

export async function getUserProfile(userId) {
  return request(`/users/${encodeURIComponent(userId)}`)
}

export async function createUserProfile({ user_id, email, display_name }) {
  return request('/users', {
    method: 'POST',
    body: JSON.stringify({ user_id, email, display_name }),
  })
}

export async function updateUserProfile(userId, patch) {
  return request(`/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify(patch || {}),
  })
}

export async function getSavedDeals(userId) {
  return request(`/users/${encodeURIComponent(userId)}/saved-deals`)
}

export async function saveDeal(userId, dealId) {
  return request(`/users/${encodeURIComponent(userId)}/saved-deals`, {
    method: 'POST',
    body: JSON.stringify({ deal_id: dealId }),
  })
}

export async function removeSavedDeal(userId, dealId) {
  return request(`/users/${encodeURIComponent(userId)}/saved-deals/${encodeURIComponent(dealId)}`, {
    method: 'DELETE',
  })
}

export async function clearSavedDeals(userId) {
  return request(`/users/${encodeURIComponent(userId)}/saved-deals`, { method: 'DELETE' })
}

export async function getFavorites(userId) {
  return request(`/users/${encodeURIComponent(userId)}/favorites`)
}

export async function addFavorite(userId, restaurantId) {
  return request(`/users/${encodeURIComponent(userId)}/favorites`, {
    method: 'POST',
    body: JSON.stringify({ restaurant_id: restaurantId }),
  })
}

export async function clearFavorites(userId) {
  return request(`/users/${encodeURIComponent(userId)}/favorites`, { method: 'DELETE' })
}

export async function getNotificationPreferences(userId) {
  return request(`/users/${encodeURIComponent(userId)}/notifications`)
}

export async function setNotificationPreference(userId, notification_type, is_enabled) {
  return request(`/users/${encodeURIComponent(userId)}/notifications`, {
    method: 'POST',
    body: JSON.stringify({ notification_type, is_enabled }),
  })
}

export async function updateNotificationPreference(userId, notification_type, is_enabled) {
  return request(`/users/${encodeURIComponent(userId)}/notifications`, {
    method: 'PUT',
    body: JSON.stringify({ notification_type, is_enabled }),
  })
}

export async function clearNotificationPreferences(userId) {
  return request(`/users/${encodeURIComponent(userId)}/notifications`, { method: 'DELETE' })
}

export async function getRewards(userId) {
  return request(`/users/${encodeURIComponent(userId)}/rewards`)
}

export async function createRewardAccount(userId, restaurantId, points_balance) {
  return request(`/users/${encodeURIComponent(userId)}/rewards`, {
    method: 'POST',
    body: JSON.stringify({ restaurant_id: restaurantId, points_balance }),
  })
}

export async function changeRewardPoints(userId, restaurantId, points_change) {
  return request(`/users/${encodeURIComponent(userId)}/rewards/${encodeURIComponent(restaurantId)}`, {
    method: 'PUT',
    body: JSON.stringify({ points_change }),
  })
}

export async function deleteRewardAccount(userId, restaurantId) {
  return request(`/users/${encodeURIComponent(userId)}/rewards/${encodeURIComponent(restaurantId)}`, {
    method: 'DELETE',
  })
}

export async function getRewardTransactions() {
  return request('/rewards/transactions')
}

export async function createRewardTransaction({ reward_account_id, points_change, transaction_type }) {
  return request('/rewards/transactions', {
    method: 'POST',
    body: JSON.stringify({ reward_account_id, points_change, transaction_type }),
  })
}
