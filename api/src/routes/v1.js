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
    const { restaurant_id, points_balance } = req.body || {};
    if (!restaurant_id) throw badRequest('restaurant_id is required');

    const supabase = getSupabaseAdminClient();
    const payload = {
      user_id: userId,
      restaurant_id,
      points_balance: typeof points_balance === 'number' ? points_balance : 0,
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
    const { points_change } = req.body || {};
    const delta = asNumberOrUndefined(points_change);
    if (delta === undefined) throw badRequest('points_change is required and must be a number');

    const supabase = getSupabaseAdminClient();

    const { data: current, error: readError } = await supabase
      .from(TABLES.rewards)
      .select('*')
      .eq('user_id', userId)
      .eq('restaurant_id', restaurantId)
      .single();

    if (readError) throw mapSupabaseError(readError);

    const newBalance = (asNumberOrUndefined(current.points_balance) || 0) + delta;

    const { data, error } = await supabase
      .from(TABLES.rewards)
      .update({ points_balance: newBalance, last_updated_at: new Date().toISOString() })
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

module.exports = router;
