import { createClient } from '@supabase/supabase-js'
import { config } from '../config/index.js'

if (!config.supabaseUrl || !config.supabaseKey) {
    throw new Error('Supabase URL and Anon Key must be provided in environment variables.')
}

// Initialize the Supabase client
export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
    auth: {
        persistSession: false,
    }
})
