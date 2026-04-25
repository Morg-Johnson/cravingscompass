const { createClient } = require('@supabase/supabase-js');

function getSupabaseAdminClient() {
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  const key = serviceKey || anonKey;

  if (!url || !key) {
    const err = new Error(
      'Missing SUPABASE_URL and a Supabase API key. Provide SUPABASE_SECRET_KEY (preferred) or SUPABASE_PUBLISHABLE_KEY. ' +
        'Alternatively, SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY are supported.'
    );
    err.statusCode = 500;
    err.code = 'config_error';
    throw err;
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

module.exports = {
  getSupabaseAdminClient,
};
