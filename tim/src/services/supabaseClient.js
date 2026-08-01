import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tbypvcdhypdtyyqzxkuk.supabase.co'
// ⚠️ ОБЯЗАТЕЛЬНО ДОЛЖНЫ БЫТЬ КАВЫЧКИ С ОБЕИХ СТОРОН КЛЮЧА:
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieXB2Y2RoeXBkdHl5cXp4a3VrIiwicm9sZSI6ImFub24iLCJpYX...' 

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
