import { supabase } from './supabaseClient';

// ==========================================
// Поиск пользователей по username
// ==========================================
export const searchUsersByUsername = async (query, currentUserId) => {
  // Удаляем пробелы
  const cleanQuery = query.trim().toLowerCase().replace('@', '');

  // Не искать, если запрос слишком короткий
  if (cleanQuery.length < 2) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      username,
      full_name,
      avatar_url,
      bio,
      is_online,
      last_seen
    `)
    .ilike('username', `%${cleanQuery}%`)
    .neq('id', currentUserId)
    .order('username')
    .limit(20);

  if (error) {
    console.error(error);
    throw new Error('Не удалось выполнить поиск пользователей');
  }

  return data ?? [];
};