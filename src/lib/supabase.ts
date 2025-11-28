import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://tosodvjvzifveabjqitb.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// App version from environment
export const APP_VERSION_CODE = Number(import.meta.env.VITE_APP_VERSION_CODE) || 1
export const APP_VERSION_NAME = import.meta.env.VITE_APP_VERSION_NAME || '1.0.0'
