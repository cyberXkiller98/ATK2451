import { supabase } from './supabaseClient';

// 1. Вход или Регистрация просто по никнейму (@username)
export const loginOrCreateUser = async (usernameInput) => {
  const cleanUsername = usernameInput.trim().toLowerCase().replace('@', '');
  
  if (!cleanUsername || cleanUsername.length < 3) {
    throw new Error('Юзернейм должен быть не менее 3 символов');
  }

  // Проверяем, есть ли такой юзер в таблице profiles
  let { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', cleanUsername)
    .maybeSingle();

  if (fetchError) throw fetchError;

  // Если пользователя нет — создаем его автоматически
  if (!profile) {
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        username: cleanUsername,
        full_name: cleanUsername,
        is_online: true
      })
      .select()
      .single();

    if (createError) throw createError;
    profile = newProfile;
  }

  // Сохраняем пользователя в память браузера (localStorage)
  localStorage.setItem('chat_user', JSON.stringify(profile));
  return profile;
};

// 2. Получить текущего вошедшего пользователя из памяти браузера
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('chat_user');
  return userStr ? JSON.parse(userStr) : null;
};

// 3. Выход из аккаунта
export const logoutUser = () => {
  localStorage.removeItem('chat_user');
};
