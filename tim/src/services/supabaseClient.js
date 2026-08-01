import { createClient } from '@supabase/supabase-js'

// Вставляем ключи напрямую, чтобы они точно работали на Vercel без всяких .env
const supabaseUrl = 'https://tbypvcdhypdtyyqzxkuk.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieXB2Y2RoeXBkdHl5cXp4a3VrIiwicm9sZSI6ImFub24iLCJpWFVC...' // Вставь свой реальный длинный anon ключ из Supabase

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
