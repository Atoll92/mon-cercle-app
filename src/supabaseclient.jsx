import { createClient } from '@supabase/supabase-js'
import { config } from './config/environment'

export const supabase = createClient(config.supabase.url, config.supabase.anonKey)