import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ojgachjiaihibepdfqwd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9qZ2FjaGppYWloaWJlcGRmcXdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1NjczMTYsImV4cCI6MjEwMTE0MzMxNn0.vvF2rH2TlovCDGhVaHhb5ot_Mey6pvLQ1dXgAdB841I'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)