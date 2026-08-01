import { createClient } from '@supabase/supabase-js'

// Пропиши свои реальные данные прямо здесь
const supabaseUrl = 'https://tbypvcdhypdtyyqzxkuk.supabase.co'
const supabaseAnonKey =eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRieXB2Y2RoeXBkdHl5cXp4a3VrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1OTQ0ODgsImV4cCI6MjEwMTE3MDQ4OH0.RwsaMHqkMKbOt05RvdqssLkU3mmmZxdqk7LQWWythsA
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
