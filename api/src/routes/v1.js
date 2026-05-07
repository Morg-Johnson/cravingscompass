const express = require('express');
const { randomUUID } = require('crypto');
const { getSupabaseAdminClient } = require('../supabase');

const router = express.Router();

const TABLES = {
  users: 'user_profiles',
  restaurants: 'restaurants',
  deals: 'deals',
  savedDeals: 'saved_deals',
  favorites: 'favorite_restaurants',
  notifications: 'notification_preferences',
  rewards: 'reward_accounts',
  rewardTransactions: 'reward_transactions',
};

function badRequest(message) {
  const err = new Error(message);
  err.statusCode = 400;
  err.code = 'bad_request';
  return err;
}

function mapSupabaseError(error) {
  if (!error) return null;
  const message = error.message || 'Database error';
  const err = new Error(message);

  if (/Could not find the '.*' column of '.*' in the schema cache/i.test(message)) {
    err.statusCode = 400;
    err.code = 'invalid_field';
    return err;
  }

  if (/invalid input syntax for type uuid/i.test(message)) {
    err.statusCode = 400;
    err.code = 'invalid_field';
    return err;
  }

  // Heuristic mapping for common Postgres constraint failures.
  // Supabase/PostgREST often surfaces these as message strings.
  if (
    /violates not-null constraint/i.test(message) ||
    /violates check constraint/i.test(message) ||
    /violates unique constraint/i.test(message) ||
    /violates exclusion constraint/i.test(message)
  ) {
    err.statusCode = 400;
    err.code = 'invalid_field';
    return err;
  }

  err.statusCode = 500;
  err.code = 'db_error';
  return err;
}

function asNumberOrUndefined(value) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (Number.isNaN(n)) return undefined;
  return n;
}

async function getDealByAnyId(supabase, dealId) {
  const byId = await supabase.from(TABLES.deals).select('*').eq('id', dealId).maybeSingle();
  if (!byId.error && byId.data) return byId;

  const byDealId = await supabase.from(TABLES.deals).select('*').eq('deal_id', dealId).maybeSingle();
  return byDealId;
}

router.post('/users', async (req, res, next) => {
  try {
    const { user_id, email, display_name, budget_preference, home_location, work_or_school_location } = req.body || {};
    if (!email) throw badRequest('email is required');

    const supabase = getSupabaseAdminClient();
    const payload = {
      user_id: user_id || randomUUID(),
      email,
      display_name: display_name ?? null,
      budget_preference: budget_preference ?? null,
      home_location: home_location ?? null,
      work_or_school_location: work_or_school_location ?? null,
    };

    const { data, error } = await supabase.from(TABLES.users).insert(payload).select('*').single();
    if (error) throw mapSupabaseError(error);

    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/users', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from(TABLES.users).select('*');
    if (error) throw mapSupabaseError(error);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/users/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from(TABLES.users).select('*').eq('user_id', userId).single();
    if (error) {
      if (error.code === 'PGRST116') {
        res.status(404).json({ error: { code: 'not_found', message: 'User not found' } });
        return;
      }
      throw mapSupabaseError(error);
    }
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.put('/users/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase.from(TABLES.users).update(req.body || {}).eq('user_id', userId).select('*').single();
    if (error) throw mapSupabaseError(error);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from(TABLES.users).delete().eq('user_id', userId);
    if (error) throw mapSupabaseError(error);
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

router.post('/restaurants', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from(TABLES.restaurants).insert(req.body || {}).select('*').single();
    if (error) throw mapSupabaseError(error);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/restaurants', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from(TABLES.restaurants).select('*');
    if (error) throw mapSupabaseError(error);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/restaurants/:restaurantId', async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const supabase = getSupabaseAdminClient();
    const result = await supabase.from(TABLES.restaurants).select('*').eq('restaurant_id', restaurantId).maybeSingle();
    if (result.error) throw mapSupabaseError(result.error);
    if (!result.data) {
      res.status(404).json({ error: { code: 'not_found', message: 'Restaurant not found' } });
      return;
    }

    res.json(result.data);
  } catch (e) {
    next(e);
  }
});

router.put('/restaurants/:restaurantId', async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const supabase = getSupabaseAdminClient();

    const result = await supabase.from(TABLES.restaurants).update(req.body || {}).eq('restaurant_id', restaurantId).select('*').maybeSingle();
    if (result.error) throw mapSupabaseError(result.error);
    if (!result.data) {
      res.status(404).json({ error: { code: 'not_found', message: 'Restaurant not found' } });
      return;
    }

    res.json(result.data);
  } catch (e) {
    next(e);
  }
});

router.delete('/restaurants/:restaurantId', async (req, res, next) => {
  try {
    const { restaurantId } = req.params;
    const supabase = getSupabaseAdminClient();

    const del = await supabase.from(TABLES.restaurants).delete().eq('restaurant_id', restaurantId);
    if (del.error) throw mapSupabaseError(del.error);
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

router.post('/deals', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from(TABLES.deals).insert(req.body || {}).select('*').single();
    if (error) throw mapSupabaseError(error);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/deals', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();

    const sort = String(req.query.sort || '').toLowerCase();
    const query = req.query.query ? String(req.query.query) : null;

    const missingColumnRegex = /column\s+[^\s]+\.(\w+)\s+does not exist/i;

    async function runDealsQuery(options) {
      let qb = supabase.from(TABLES.deals).select('*');

      if (options.useExpirationTime) {
        qb = qb.gt('expiration_time', new Date().toISOString());
      }

      if (options.useIsExpired) {
        qb = qb.eq('is_expired', false);
      }

      if (options.useExpiresAt) {
        qb = qb.or('expires_at.is.null,expires_at.gt.now()');
      }

      if (query && options.useSearch) {
        qb = qb.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
      }

      if (sort === 'price_asc' && options.usePriceSort) {
        qb = qb.order('price', { ascending: true, nullsFirst: false });
      } else if (options.useValueScoreSort && options.usePriceSort) {
        qb = qb.order('value_score', { ascending: false, nullsFirst: false }).order('price', { ascending: true, nullsFirst: false });
      } else if (options.usePriceSort) {
        qb = qb.order('price', { ascending: true, nullsFirst: false });
      }

      return qb;
    }

    const attempts = [
      // Preferred for current schema
      { useExpirationTime: true, useIsExpired: true, useExpiresAt: false, useSearch: true, useValueScoreSort: true, usePriceSort: true },
      { useExpirationTime: true, useIsExpired: true, useExpiresAt: false, useSearch: false, useValueScoreSort: true, usePriceSort: true },
      // Fallbacks for alternative schemas
      { useExpirationTime: false, useIsExpired: true, useExpiresAt: false, useSearch: true, useValueScoreSort: true, usePriceSort: true },
      { useExpirationTime: false, useIsExpired: false, useExpiresAt: true, useSearch: true, useValueScoreSort: true, usePriceSort: true },
      { useExpirationTime: false, useIsExpired: false, useExpiresAt: false, useSearch: false, useValueScoreSort: true, usePriceSort: true },
      { useExpirationTime: false, useIsExpired: false, useExpiresAt: false, useSearch: false, useValueScoreSort: false, usePriceSort: true },
      { useExpirationTime: false, useIsExpired: false, useExpiresAt: false, useSearch: false, useValueScoreSort: false, usePriceSort: false },
    ];

    let lastError = null;
    for (const attempt of attempts) {
      const qb = await runDealsQuery(attempt);
      // eslint-disable-next-line no-await-in-loop
      const { data, error } = await qb;
      if (!error) {
        res.json(data);
        return;
      }

      lastError = error;
      const msg = error.message || '';
      if (!missingColumnRegex.test(msg)) {
        throw mapSupabaseError(error);
      }
      // If it's a missing column error, retry with fewer assumptions.
    }

    throw mapSupabaseError(lastError);
  } catch (e) {
    next(e);
  }
});

router.get('/deals/:dealId', async (req, res, next) => {
  try {
    const { dealId } = req.params;
    const supabase = getSupabaseAdminClient();

    const { data, error } = await getDealByAnyId(supabase, dealId);
    if (error) throw mapSupabaseError(error);
    if (!data) {
      res.status(404).json({ error: { code: 'not_found', message: 'Deal not found' } });
      return;
    }

    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.put('/deals/:dealId', async (req, res, next) => {
  try {
    const { dealId } = req.params;
    const supabase = getSupabaseAdminClient();

    let result = await supabase.from(TABLES.deals).update(req.body || {}).eq('id', dealId).select('*').maybeSingle();
    if (result.error) {
      const msg = result.error.message || '';
      if (/column\s+[^\s]+\.id\s+does not exist/i.test(msg)) {
        result = { data: null, error: null };
      } else {
        throw mapSupabaseError(result.error);
      }
    }

    if (!result.data) {
      const retry = await supabase.from(TABLES.deals).update(req.body || {}).eq('deal_id', dealId).select('*').maybeSingle();
      if (retry.error) throw mapSupabaseError(retry.error);
      if (!retry.data) {
        res.status(404).json({ error: { code: 'not_found', message: 'Deal not found' } });
        return;
      }
      res.json(retry.data);
      return;
    }

    res.json(result.data);
  } catch (e) {
    next(e);
  }
});

router.delete('/deals/:dealId', async (req, res, next) => {
  try {
    const { dealId } = req.params;
    const supabase = getSupabaseAdminClient();

    let del = await supabase.from(TABLES.deals).delete().eq('id', dealId);
    if (del.error) {
      const msg = del.error.message || '';
      if (/column\s+[^\s]+\.id\s+does not exist/i.test(msg)) {
        del = { data: null, error: null };
      } else {
        throw mapSupabaseError(del.error);
      }
    }

    if (!del.error) {
      const retry = await supabase.from(TABLES.deals).delete().eq('deal_id', dealId);
      if (retry.error) throw mapSupabaseError(retry.error);
    }

    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

router.post('/users/:userId/saved-deals', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { deal_id } = req.body || {};
    if (!deal_id) throw badRequest('deal_id is required');

    const supabase = getSupabaseAdminClient();
    const payload = { user_id: userId, deal_id };
    const { data, error } = await supabase.from(TABLES.savedDeals).insert(payload).select('*').single();
    if (error) throw mapSupabaseError(error);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/users/:userId/saved-deals', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdminClient();

    // Prefer enriched response using foreign table relationships (saved_deals -> deals -> restaurants)
    // so the client can display human-readable deal/restaurant names.
    const enriched = await supabase
      .from(TABLES.savedDeals)
      .select(
        'saved_deal_id,user_id,deal_id,saved_at,deal:deals(deal_id,title,price,value_score,expiration_time,restaurant_id,restaurant:restaurants(restaurant_id,name))'
      )
      .eq('user_id', userId);

    if (!enriched.error) {
      res.json(enriched.data);
      return;
    }

    // Fallback if relationships aren't configured in PostgREST schema cache.
    const basic = await supabase.from(TABLES.savedDeals).select('*').eq('user_id', userId);
    if (basic.error) throw mapSupabaseError(basic.error);
    res.json(basic.data);
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:userId/saved-deals', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from(TABLES.savedDeals).delete().eq('user_id', userId);
    if (error) throw mapSupabaseError(error);
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:userId/saved-deals/:dealId', async (req, res, next) => {
  try {
    const { userId, dealId } = req.params;
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from(TABLES.savedDeals).delete().eq('user_id', userId).eq('deal_id', dealId);
    if (error) throw mapSupabaseError(error);
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

router.post('/users/:userId/favorites', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { restaurant_id } = req.body || {};
    if (!restaurant_id) throw badRequest('restaurant_id is required');

    const supabase = getSupabaseAdminClient();
    const payload = { user_id: userId, restaurant_id };
    const { data, error } = await supabase.from(TABLES.favorites).insert(payload).select('*').single();
    if (error) throw mapSupabaseError(error);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/users/:userId/favorites', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from(TABLES.favorites).select('*').eq('user_id', userId);
    if (error) throw mapSupabaseError(error);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:userId/favorites/:restaurantId', async (req, res, next) => {
  try {
    const { userId, restaurantId } = req.params;
    const supabase = getSupabaseAdminClient();
    const del = await supabase.from(TABLES.favorites).delete().eq('user_id', userId).eq('restaurant_id', restaurantId);
    if (del.error) throw mapSupabaseError(del.error);
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:userId/favorites', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from(TABLES.favorites).delete().eq('user_id', userId);
    if (error) throw mapSupabaseError(error);
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

router.post('/users/:userId/notifications', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { notification_type, is_enabled } = req.body || {};
    if (!notification_type) throw badRequest('notification_type is required');
    if (typeof is_enabled !== 'boolean') throw badRequest('is_enabled must be boolean');

    const supabase = getSupabaseAdminClient();
    const payload = { user_id: userId, notification_type, is_enabled };

    const { data, error } = await supabase
      .from(TABLES.notifications)
      .upsert(payload, { onConflict: 'user_id,notification_type' })
      .select('*')
      .single();

    if (error) throw mapSupabaseError(error);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/users/:userId/notifications', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from(TABLES.notifications).select('*').eq('user_id', userId);
    if (error) throw mapSupabaseError(error);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.put('/users/:userId/notifications', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { notification_type } = req.body || {};
    if (!notification_type) throw badRequest('notification_type is required');

    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from(TABLES.notifications)
      .update(req.body || {})
      .eq('user_id', userId)
      .eq('notification_type', notification_type)
      .select('*')
      .single();

    if (error) throw mapSupabaseError(error);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:userId/notifications', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from(TABLES.notifications).delete().eq('user_id', userId);
    if (error) throw mapSupabaseError(error);
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

router.post('/users/:userId/rewards', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { restaurant_id, points_balance, points_expiration_date } = req.body || {};
    if (!restaurant_id) throw badRequest('restaurant_id is required');

    const supabase = getSupabaseAdminClient();
    const payload = {
      user_id: userId,
      restaurant_id,
      points_balance: typeof points_balance === 'number' ? points_balance : 0,
      points_expiration_date: points_expiration_date || null,
    };

    const { data, error } = await supabase.from(TABLES.rewards).insert(payload).select('*').single();
    if (error) throw mapSupabaseError(error);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.get('/users/:userId/rewards', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.from(TABLES.rewards).select('*').eq('user_id', userId);
    if (error) throw mapSupabaseError(error);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.put('/users/:userId/rewards/:restaurantId', async (req, res, next) => {
  try {
    const { userId, restaurantId } = req.params;
    const { points_change, points_expiration_date } = req.body || {};
    const delta = asNumberOrUndefined(points_change);
    const hasExpiration = points_expiration_date !== undefined;
    if (delta === undefined && !hasExpiration) {
      throw badRequest('points_change must be a number or points_expiration_date must be provided');
    }

    const supabase = getSupabaseAdminClient();

    const { data: current, error: readError } = await supabase
      .from(TABLES.rewards)
      .select('*')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (readError) throw mapSupabaseError(readError);

    const newBalance = (asNumberOrUndefined(current.points_balance) || 0) + (delta || 0);

    const patch = {
      points_balance: newBalance,
      last_updated_at: new Date().toISOString(),
    };

    if (hasExpiration) {
      patch.points_expiration_date = points_expiration_date || null;
    }

    const { data, error } = await supabase
      .from(TABLES.rewards)
      .update(patch)
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .select('*')
      .single();

    if (error) throw mapSupabaseError(error);

    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:userId/rewards/:restaurantId', async (req, res, next) => {
  try {
    const { userId, restaurantId } = req.params;
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.from(TABLES.rewards).delete().eq('user_id', userId).eq('restaurant_id', restaurantId);
    if (error) throw mapSupabaseError(error);
    res.json({ deleted: true });
  } catch (e) {
    next(e);
  }
});

router.get('/rewards/transactions', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase
      .from(TABLES.rewardTransactions)
      .select('*')
      .order('transaction_timestamp', { ascending: false });
    if (error) throw mapSupabaseError(error);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post('/rewards/transactions', async (req, res, next) => {
  try {
    const supabase = getSupabaseAdminClient();

    const { data, error } = await supabase.from(TABLES.rewardTransactions).insert(req.body || {}).select('*').single();
    if (error) throw mapSupabaseError(error);
    res.status(201).json(data);
  } catch (e) {
    next(e);
  }
});

router.post('/dev/seed', async (req, res, next) => {
  try {
    if (String(process.env.NODE_ENV || '').toLowerCase() === 'production') {
      res.status(403).json({ error: { code: 'forbidden', message: 'Seeding is disabled in production' } });
      return;
    }

    const supabase = getSupabaseAdminClient();

    const expiration_time = '2030-01-01T00:00:00Z';

    const restaurantSeeds = [
      { name: 'Chipotle', location_address: '2401 Notre Dame Blvd, Chico, CA 95928' },
      { name: 'Popeyes', location_address: '2050 Dr Martin Luther King Jr Pkwy, Chico, CA 95928' },
      { name: 'The Habit Burger Grill', location_address: '1930 E 20th St, Chico, CA 95928' },
    ];

    const reset = String(req.query.reset || '').toLowerCase() === 'true';
    if (reset) {
      const names = restaurantSeeds.map((r) => r.name);
      const { data: existingRestaurants, error: existingRestaurantsError } = await supabase
        .from(TABLES.restaurants)
        .select('restaurant_id,name')
        .in('name', names);
      if (existingRestaurantsError) throw mapSupabaseError(existingRestaurantsError);

      const ids = (existingRestaurants || []).map((r) => r.restaurant_id).filter(Boolean);

      let deals_deleted = 0;
      let restaurants_deleted = 0;

      if (ids.length > 0) {
        const delDeals = await supabase.from(TABLES.deals).delete().in('restaurant_id', ids);
        if (delDeals.error) throw mapSupabaseError(delDeals.error);
        deals_deleted = Array.isArray(delDeals.data) ? delDeals.data.length : 0;

        const delRestaurants = await supabase.from(TABLES.restaurants).delete().in('restaurant_id', ids);
        if (delRestaurants.error) throw mapSupabaseError(delRestaurants.error);
        restaurants_deleted = Array.isArray(delRestaurants.data) ? delRestaurants.data.length : 0;
      }

      // continue to (re)seed after reset
      // eslint-disable-next-line no-unused-vars
      const _resetSummary = { deals_deleted, restaurants_deleted };
    }

    let restaurants_created = 0;
    let restaurants_updated = 0;
    const restaurants = [];
    const restaurantsByName = {};

    for (const seed of restaurantSeeds) {
      // eslint-disable-next-line no-await-in-loop
      const existing = await supabase
        .from(TABLES.restaurants)
        .select('*')
        .eq('name', seed.name)
        .order('created_at', { ascending: false })
        .limit(1);
      if (existing.error) throw mapSupabaseError(existing.error);
      const existingRow = Array.isArray(existing.data) ? existing.data[0] : null;

      if (existingRow) {
        // eslint-disable-next-line no-await-in-loop
        const updated = await supabase
          .from(TABLES.restaurants)
          .update({ location_address: seed.location_address })
          .eq('restaurant_id', existingRow.restaurant_id)
          .select('*')
          .single();
        if (updated.error) throw mapSupabaseError(updated.error);
        restaurants.push(updated.data);
        restaurantsByName[updated.data.name] = updated.data;
        restaurants_updated += 1;
        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const created = await supabase.from(TABLES.restaurants).insert(seed).select('*').single();
      if (created.error) throw mapSupabaseError(created.error);
      restaurants.push(created.data);
      restaurantsByName[created.data.name] = created.data;
      restaurants_created += 1;
    }

    const chipotleId = restaurantsByName?.Chipotle?.restaurant_id;
    const popeyesId = restaurantsByName?.Popeyes?.restaurant_id;
    const habitId = restaurantsByName?.['The Habit Burger Grill']?.restaurant_id;

    const dealsPayload = [
      // Chipotle
      { restaurant_id: chipotleId, title: 'Chicken Burrito', price: 9.49, calories: 850, expiration_time, is_expired: false, value_score: 9.2 },
      { restaurant_id: chipotleId, title: 'Bowl + Chips & Guac', price: 12.99, calories: 1120, expiration_time, is_expired: false, value_score: 6.8 },
      { restaurant_id: chipotleId, title: 'Tacos (3)', price: 9.99, calories: 780, expiration_time, is_expired: false, value_score: 5.2 },

      // Popeyes
      { restaurant_id: popeyesId, title: 'Chicken Sandwich Combo', price: 9.49, calories: 1240, expiration_time, is_expired: false, value_score: 8.1 },
      { restaurant_id: popeyesId, title: '8pc Nuggets + Fries', price: 6.99, calories: 910, expiration_time, is_expired: false, value_score: 6.3 },
      { restaurant_id: popeyesId, title: '2pc Chicken + Biscuit', price: 5.99, calories: 780, expiration_time, is_expired: false, value_score: 5.6 },

      // The Habit
      { restaurant_id: habitId, title: 'Charburger w/ Cheese', price: 8.79, calories: 820, expiration_time, is_expired: false, value_score: 7.2 },
      { restaurant_id: habitId, title: 'Chicken Club Sandwich', price: 9.29, calories: 920, expiration_time, is_expired: false, value_score: 5.8 },
      { restaurant_id: habitId, title: 'Onion Rings + Drink', price: 4.99, calories: 640, expiration_time, is_expired: false, value_score: 6.1 },
    ].filter((d) => Boolean(d.restaurant_id));

    let deals_created = 0;
    let deals_updated = 0;
    const deals = [];

    for (const seed of dealsPayload) {
      // eslint-disable-next-line no-await-in-loop
      const existing = await supabase
        .from(TABLES.deals)
        .select('*')
        .eq('restaurant_id', seed.restaurant_id)
        .eq('title', seed.title)
        .order('created_at', { ascending: false })
        .limit(1);
      if (existing.error) throw mapSupabaseError(existing.error);
      const existingRow = Array.isArray(existing.data) ? existing.data[0] : null;

      if (existingRow) {
        const dealId = existingRow.deal_id || existingRow.id;
        if (!dealId) {
          deals.push(existingRow);
          continue;
        }

        // eslint-disable-next-line no-await-in-loop
        const updated = await supabase
          .from(TABLES.deals)
          .update({
            price: seed.price,
            calories: seed.calories,
            expiration_time: seed.expiration_time,
            is_expired: seed.is_expired,
            value_score: seed.value_score,
          })
          .eq('deal_id', existingRow.deal_id || dealId)
          .select('*')
          .maybeSingle();

        if (updated.error) {
          // Fallback for schemas that use `id` instead of `deal_id`.
          // eslint-disable-next-line no-await-in-loop
          const retry = await supabase
            .from(TABLES.deals)
            .update({
              price: seed.price,
              calories: seed.calories,
              expiration_time: seed.expiration_time,
              is_expired: seed.is_expired,
              value_score: seed.value_score,
            })
            .eq('id', dealId)
            .select('*')
            .maybeSingle();
          if (retry.error) throw mapSupabaseError(retry.error);
          if (retry.data) {
            deals.push(retry.data);
            deals_updated += 1;
          }
        } else if (updated.data) {
          deals.push(updated.data);
          deals_updated += 1;
        }

        continue;
      }

      // eslint-disable-next-line no-await-in-loop
      const created = await supabase.from(TABLES.deals).insert(seed).select('*').single();
      if (created.error) throw mapSupabaseError(created.error);
      deals.push(created.data);
      deals_created += 1;
    }

    res.status(201).json({
      restaurants_created,
      restaurants_updated,
      deals_created,
      deals_updated,
      restaurants,
      deals,
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
