import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tbypvcdhypdtyyqzxkuk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieXB2Y2RoeXBkdHl5cXp4a3VrIiwicm9sZSI6ImFub24iLCJpYX...' // <-- Обязательно в кавычках!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
