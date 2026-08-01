import { createClient } from '@supabase/supabase-js';

// URL проекта
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

// Публичный ключ (anon key)
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Проверяем, что переменные окружения существуют
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Не найдены VITE_SUPABASE_URL или VITE_SUPABASE_ANON_KEY. Проверьте файл .env'
  );
}

// Создаем клиент Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);