import { supabase } from './supabaseClient';

// Регистрация просто по нику в таблице profiles
export const registerUser = async (emailOrUsername, password, customUsername) => {
  const username = (customUsername || emailOrUsername).trim().toLowerCase().replace('@', '');
  
  if (!username || username.length < 3) {
    throw new Error('Юзернейм должен быть не менее 3 символов');
  }

  // Проверяем, есть ли уже такой юзер
  const { data: existing } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (existing) {
    throw new Error('Такое имя пользователя уже занято');
  }

  // Создаем профиль
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      username: username,
      full_name: username,
      is_online: true
    })
    .select()
    .single();

  if (error) throw error;

  // Сохраняем сессию в localStorage
  localStorage.setItem('chat_user', JSON.stringify(data));
  return { user: data };
};

// Вход просто по нику (или email)
export const loginUser = async (emailOrUsername, password) => {
  const username = emailOrUsername.trim().toLowerCase().replace('@', '');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error || !data) {
    throw new Error('Пользователь не найден. Проверьте имя.');
  }

  // Сохраняем сессию в localStorage
  localStorage.setItem('chat_user', JSON.stringify(data));
  return { user: data };
};

// Получить текущего залогиненного юзера
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('chat_user');
  return userStr ? JSON.parse(userStr) : null;
};

// Выход
export const logoutUser = () => {
  localStorage.removeItem('chat_user');
};
