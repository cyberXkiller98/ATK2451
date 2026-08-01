import { supabase } from './supabaseClient';

// Регистрация только через таблицу profiles (никакой почты и Supabase Auth)
export const registerUser = async (identifier, password, customUsername) => {
  const username = (customUsername || identifier).trim().toLowerCase().replace('@', '');
  
  if (!username || username.length < 3) {
    throw new Error('Юзернейм должен быть не менее 3 символов');
  }

  // Проверяем, занят ли ник
  const { data: existing, error: checkError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (checkError) throw checkError;

  if (existing) {
    throw new Error('Такое имя пользователя уже занято');
  }

  // Создаем профиль в таблице profiles напрямую
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

  // Сохраняем сессию в localStorage браузера
  localStorage.setItem('chat_user', JSON.stringify(data));
  return { user: data };
};

// Вход через таблицу profiles
export const loginUser = async (identifier, password) => {
  const username = identifier.trim().toLowerCase().replace('@', '');

  if (!username) {
    throw new Error('Введите имя пользователя');
  }

  // Ищем юзера в таблице profiles
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (error) throw error;

  if (!data) {
    throw new Error('Пользователь не найден. Сначала зарегистрируйтесь.');
  }

  // Сохраняем сессию в localStorage
  localStorage.setItem('chat_user', JSON.stringify(data));
  return { user: data };
};

// Получить текущего залогиненного юзера из памяти
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('chat_user');
  return userStr ? JSON.parse(userStr) : null;
};

// Выход
export const logoutUser = () => {
  localStorage.removeItem('chat_user');
};
