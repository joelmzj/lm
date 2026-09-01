import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ecxbavfcsfkzdotufxxx.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjeGJhdmZjc2ZremRvdHVmeHh4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyMDA4NDMsImV4cCI6MjEwMzc3Njg0M30.FLTNt-Llo32nnwFtsU3RyClOr22QLKkCw84NCg6ZJX8'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)