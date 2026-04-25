# Cravings Compass API — curl Test Commands

Use this file to test every endpoint defined in `api/openapi.yaml`.

## Before you start

- Make sure the API is running:
  - From `api/`: `npm run dev`
- Confirm the port printed in the API logs (example: `API listening on port 8000`).

## 0) Set variables (copy/paste)

```bash
BASE_URL="http://localhost:8000/v1"
```

If your server is on a different port, update `8000`.

## 1) Deals (read-only sanity checks)

### 1.1 List deals
```bash
curl -i "$BASE_URL/deals"
```

### 1.2 Get a deal by id
Replace `DEAL_ID` with a real value like `bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1`.

```bash
curl -i "$BASE_URL/deals/DEAL_ID"
```

### 1.3 Update a deal (example: mark expired)
```bash
curl -i -X PUT "$BASE_URL/deals/DEAL_ID" \
  -H "Content-Type: application/json" \
  -d '{"is_expired": true}'
```

### 1.4 Delete a deal
```bash
curl -i -X DELETE "$BASE_URL/deals/DEAL_ID"
```

## 2) Users

### 2.1 Create user profile (POST /users)
```bash
curl -i -X POST "$BASE_URL/users" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "curl.user1@example.com",
    "display_name": "Curl User",
    "budget_preference": 12
  }'
```

Copy the `user_id` from the response and set it:

```bash
USER_ID="REPLACE_WITH_user_id"
```

### 2.2 List all users
```bash
curl -i "$BASE_URL/users"
```

### 2.3 Get user by id
```bash
curl -i "$BASE_URL/users/$USER_ID"
```

### 2.4 Update user
```bash
curl -i -X PUT "$BASE_URL/users/$USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"display_name":"Curl User Updated"}'
```

## 3) Restaurants

### 3.1 Create restaurant
Note: this only succeeds if your Supabase has a `restaurants` table matching the fields you send.

```bash
curl -i -X POST "$BASE_URL/restaurants" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Curl Burger",
    "location_address": "123 Main St, Chico, CA"
  }'
```

Copy the restaurant id from the response and set it:

```bash
RESTAURANT_ID="REPLACE_WITH_restaurant_id"
```

Note: the assignment must look exactly like the line above (no extra characters). For example, do NOT do `RESTAURANT_ID=:"..."`.

### 3.2 List restaurants
```bash
curl -i "$BASE_URL/restaurants"
```

### 3.3 Get restaurant by id
```bash
curl -i "$BASE_URL/restaurants/$RESTAURANT_ID"
```

### 3.4 Update restaurant
```bash
curl -i -X PUT "$BASE_URL/restaurants/$RESTAURANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"hours":"9AM-9PM","restaurant_type":"Fast Food"}'
```

### 3.5 Delete restaurant
```bash
curl -i -X DELETE "$BASE_URL/restaurants/$RESTAURANT_ID"
```

## 4) Deals (create)

### 4.1 Create deal
Note: your `deals` table requires `restaurant_id` and `expiration_time`.

Before creating a deal, verify the restaurant id you’re using exists (prevents foreign key errors):

```bash
curl -i "$BASE_URL/restaurants/$RESTAURANT_ID"
```

```bash
curl -i -X POST "$BASE_URL/deals" \
  -H "Content-Type: application/json" \
  -d '{
    "restaurant_id": "'$RESTAURANT_ID'",
    "title": "Curl Deal Test",
    "price": 4.99,
    "expiration_time": "2030-01-01T00:00:00Z",
    "is_expired": false,
    "value_score": 7.5
  }'
```

Copy the deal id from the response and set it:

```bash
DEAL_ID="REPLACE_WITH_deal_id"
```

## 5) Saved Deals

### 5.1 Save a deal (POST /users/{userId}/saved-deals)
```bash
curl -i -X POST "$BASE_URL/users/$USER_ID/saved-deals" \
  -H "Content-Type: application/json" \
  -d '{"deal_id":"'$DEAL_ID'"}'
```

### 5.2 List saved deals
```bash
curl -i "$BASE_URL/users/$USER_ID/saved-deals"
```

### 5.3 Remove one saved deal
```bash
curl -i -X DELETE "$BASE_URL/users/$USER_ID/saved-deals/DEAL_ID"
```

Note: use the variable form below (recommended):

```bash
curl -i -X DELETE "$BASE_URL/users/$USER_ID/saved-deals/$DEAL_ID"
```

### 5.4 Remove all saved deals
```bash
curl -i -X DELETE "$BASE_URL/users/$USER_ID/saved-deals"
```

## 6) Favorites

### 6.1 Favorite a restaurant
Before favoriting, verify the restaurant id exists:

```bash
curl -i "$BASE_URL/restaurants/$RESTAURANT_ID"
```

```bash
curl -i -X POST "$BASE_URL/users/$USER_ID/favorites" \
  -H "Content-Type: application/json" \
  -d '{"restaurant_id":"'$RESTAURANT_ID'"}'
```

### 6.2 List favorites
```bash
curl -i "$BASE_URL/users/$USER_ID/favorites"
```

### 6.3 Remove all favorites
```bash
curl -i -X DELETE "$BASE_URL/users/$USER_ID/favorites"
```

## 7) Notifications

### 7.1 Set notification preference
```bash
curl -i -X POST "$BASE_URL/users/$USER_ID/notifications" \
  -H "Content-Type: application/json" \
  -d '{"notification_type":"expiring_deals","is_enabled":true}'
```

### 7.2 Get notification settings
```bash
curl -i "$BASE_URL/users/$USER_ID/notifications"
```

### 7.3 Update notification setting
```bash
curl -i -X PUT "$BASE_URL/users/$USER_ID/notifications" \
  -H "Content-Type: application/json" \
  -d '{"notification_type":"expiring_deals","is_enabled":false}'
```

### 7.4 Delete all notification settings for the user
```bash
curl -i -X DELETE "$BASE_URL/users/$USER_ID/notifications"
```

## 8) Rewards

### 8.1 Create reward account
```bash
curl -i -X POST "$BASE_URL/users/$USER_ID/rewards" \
  -H "Content-Type: application/json" \
  -d '{"restaurant_id":"'$RESTAURANT_ID'","points_balance":100}'
```

### 8.2 Get reward accounts
```bash
curl -i "$BASE_URL/users/$USER_ID/rewards"
```

### 8.3 Add or subtract points
```bash
curl -i -X PUT "$BASE_URL/users/$USER_ID/rewards/$RESTAURANT_ID" \
  -H "Content-Type: application/json" \
  -d '{"points_change":25}'
```

### 8.4 Delete reward account
```bash
curl -i -X DELETE "$BASE_URL/users/$USER_ID/rewards/$RESTAURANT_ID"
```

## 9) Reward transactions

### 9.1 Get reward transaction history
```bash
curl -i "$BASE_URL/rewards/transactions"
```

### 9.2 Create reward transaction
First, you need a real `reward_account_id`.

Create a reward account (Section 8.1) and copy `reward_account_id` from the response, then set:

```bash
REWARD_ACCOUNT_ID="REPLACE_WITH_reward_account_id"
```

Verify the reward account still exists (prevents foreign key errors if you deleted it in Step 8.4):

```bash
curl -i "$BASE_URL/users/$USER_ID/rewards"
```

```bash
curl -i -X POST "$BASE_URL/rewards/transactions" \
  -H "Content-Type: application/json" \
  -d '{
    "reward_account_id":"'$REWARD_ACCOUNT_ID'",
    "points_change":10,
    "transaction_type":"earn"
  }'
```

Note: make sure the path is spelled exactly `rewards/transactions` (not `rewards/tranctions`).

## Troubleshooting

### Common error: "Could not find the table 'public.<table>' in the schema cache"
This means your Supabase project does not have that table (or it’s named differently). You have a known example:

- Users table is `public.user_profiles` (not `public.users`)
- Deals table appears to use `deal_id` (not `id`) and `expiration_time` (not `expires_at`)

If you paste the `CREATE TABLE ...` for the missing table, I can update the API to match it.
