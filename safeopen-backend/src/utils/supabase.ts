import { createClient } from '@supabase/supabase-js'
import { config } from '../config/index.js'
import logger from './logger.js'

if (!config.supabaseUrl) {
    throw new Error('SUPABASE_URL must be provided in environment variables.')
}

// Identity is verified by Firebase Admin (see middleware/auth.ts), not
// Supabase Auth — there is no Supabase session on these requests, so RLS
// policies keyed on auth.uid() can never match. The backend therefore talks
// to Postgres with the service-role key (full access, bypasses RLS) and is
// itself responsible for scoping every query by req.userId. The service
// role key must never be sent to the frontend.
const key = config.supabaseServiceRoleKey || config.supabaseKey

if (!config.supabaseServiceRoleKey) {
    logger.warn(
        '⚠️  SUPABASE_SERVICE_ROLE_KEY is not set — falling back to the anon key, which RLS will likely block for ' +
        'every read/write now that auth is verified via Firebase instead of Supabase Auth. ' +
        'Get the service role key from Supabase Dashboard → Project Settings → API → service_role secret, ' +
        'and also run supabase_schema_firebase_migration.sql (adjusts user_id columns for Firebase UIDs).'
    )
}

export const supabase = createClient(config.supabaseUrl, key, {
    auth: {
        persistSession: false,
    }
})
