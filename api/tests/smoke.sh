#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:8000/v1}"

# Optional inputs (set these if you want the script to exercise write endpoints)
USER_ID="${USER_ID:-}"
RESTAURANT_ID="${RESTAURANT_ID:-}"
DEAL_ID="${DEAL_ID:-}"
REWARD_ACCOUNT_ID="${REWARD_ACCOUNT_ID:-}"

fail() {
  echo "ERROR: $*" >&2
  exit 1
}

need() {
  local var_name="$1"
  local var_value="$2"
  if [[ -z "${var_value}" ]]; then
    echo "SKIP: $var_name is not set" >&2
    return 1
  fi
  return 0
}

req() {
  local method="$1"
  local path="$2"
  shift 2

  local url="${BASE_URL}${path}"
  echo
  echo ">>> ${method} ${url}"

  # -f: fail on non-2xx
  # -sS: quiet but show errors
  curl -fsS -X "${method}" "${url}" "$@" > /dev/null
}

json_req() {
  local method="$1"
  local path="$2"
  local data="$3"

  req "${method}" "${path}" \
    -H "Content-Type: application/json" \
    -d "${data}"
}

echo "BASE_URL=${BASE_URL}"

# 1) Deals (read-only sanity checks)
req GET "/deals"

if need DEAL_ID "${DEAL_ID}"; then
  req GET "/deals/${DEAL_ID}"
  json_req PUT "/deals/${DEAL_ID}" '{"is_expired": true}'
  req DELETE "/deals/${DEAL_ID}"
else
  echo "INFO: To test GET/PUT/DELETE /deals/{id}, export DEAL_ID first." >&2
fi

# 2) Users
# Note: POST /users requires an email; this script runs it only when CREATE_USER_EMAIL is provided.
CREATE_USER_EMAIL="${CREATE_USER_EMAIL:-}"
if [[ -n "${CREATE_USER_EMAIL}" ]]; then
  json_req POST "/users" "{\"email\":\"${CREATE_USER_EMAIL}\",\"display_name\":\"Curl User\",\"budget_preference\":12}"
else
  echo "INFO: To test POST /users, export CREATE_USER_EMAIL (example: curl.user1@example.com)." >&2
fi

req GET "/users"

if need USER_ID "${USER_ID}"; then
  req GET "/users/${USER_ID}"
  json_req PUT "/users/${USER_ID}" '{"display_name":"Curl User Updated"}'
else
  echo "INFO: To test /users/{userId} endpoints, export USER_ID first." >&2
fi

# 3) Restaurants
if [[ -n "${RESTAURANT_ID}" ]]; then
  req GET "/restaurants/${RESTAURANT_ID}"
  json_req PUT "/restaurants/${RESTAURANT_ID}" '{"hours":"9AM-9PM","restaurant_type":"Fast Food"}'
  req DELETE "/restaurants/${RESTAURANT_ID}"
else
  echo "INFO: To test /restaurants/{id} write endpoints, export RESTAURANT_ID first." >&2
fi

req GET "/restaurants"

# 4) Deals (create)
# Requires RESTAURANT_ID and an expiration time.
if need RESTAURANT_ID "${RESTAURANT_ID}"; then
  req GET "/restaurants/${RESTAURANT_ID}"
  json_req POST "/deals" "{\"restaurant_id\":\"${RESTAURANT_ID}\",\"title\":\"Curl Deal Test\",\"price\":4.99,\"expiration_time\":\"2030-01-01T00:00:00Z\",\"is_expired\":false,\"value_score\":7.5}"
else
  echo "INFO: To test POST /deals, export RESTAURANT_ID first." >&2
fi

# 5) Saved Deals
if need USER_ID "${USER_ID}" && need DEAL_ID "${DEAL_ID}"; then
  json_req POST "/users/${USER_ID}/saved-deals" "{\"deal_id\":\"${DEAL_ID}\"}"
  req GET "/users/${USER_ID}/saved-deals"
  req DELETE "/users/${USER_ID}/saved-deals/${DEAL_ID}"
  req DELETE "/users/${USER_ID}/saved-deals"
else
  echo "INFO: To test saved-deals endpoints, export USER_ID and DEAL_ID first." >&2
fi

# 6) Favorites
if need USER_ID "${USER_ID}" && need RESTAURANT_ID "${RESTAURANT_ID}"; then
  req GET "/restaurants/${RESTAURANT_ID}"
  json_req POST "/users/${USER_ID}/favorites" "{\"restaurant_id\":\"${RESTAURANT_ID}\"}"
  req GET "/users/${USER_ID}/favorites"
  req DELETE "/users/${USER_ID}/favorites"
else
  echo "INFO: To test favorites endpoints, export USER_ID and RESTAURANT_ID first." >&2
fi

# 7) Notifications
if need USER_ID "${USER_ID}"; then
  json_req POST "/users/${USER_ID}/notifications" '{"notification_type":"expiring_deals","is_enabled":true}'
  req GET "/users/${USER_ID}/notifications"
  json_req PUT "/users/${USER_ID}/notifications" '{"notification_type":"expiring_deals","is_enabled":false}'
  req DELETE "/users/${USER_ID}/notifications"
else
  echo "INFO: To test notifications endpoints, export USER_ID first." >&2
fi

# 8) Rewards
if need USER_ID "${USER_ID}" && need RESTAURANT_ID "${RESTAURANT_ID}"; then
  json_req POST "/users/${USER_ID}/rewards" "{\"restaurant_id\":\"${RESTAURANT_ID}\",\"points_balance\":100}"
  req GET "/users/${USER_ID}/rewards"
  json_req PUT "/users/${USER_ID}/rewards/${RESTAURANT_ID}" '{"points_change":25}'
  req DELETE "/users/${USER_ID}/rewards/${RESTAURANT_ID}"
else
  echo "INFO: To test rewards endpoints, export USER_ID and RESTAURANT_ID first." >&2
fi

# 9) Reward transactions
req GET "/rewards/transactions"

if need REWARD_ACCOUNT_ID "${REWARD_ACCOUNT_ID}"; then
  json_req POST "/rewards/transactions" "{\"reward_account_id\":\"${REWARD_ACCOUNT_ID}\",\"points_change\":10,\"transaction_type\":\"earn\"}"
else
  echo "INFO: To test POST /rewards/transactions, export REWARD_ACCOUNT_ID first." >&2
fi

echo
echo "Smoke test complete."
