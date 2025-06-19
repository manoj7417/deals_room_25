import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing Supabase URL. Please add EXPO_PUBLIC_SUPABASE_URL to your .env file.')
}

if (!supabaseAnonKey) {
  throw new Error('Missing Supabase Anon Key. Please add EXPO_PUBLIC_SUPABASE_ANON_KEY to your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Disable auto refresh token for better performance in mobile apps
    autoRefreshToken: true,
    // Persist session in local storage
    persistSession: true,
    // Detect session in URL for OAuth flows
    detectSessionInUrl: false,
    // Disable email confirmation for simpler flow
    flowType: 'pkce',
  },
}) 