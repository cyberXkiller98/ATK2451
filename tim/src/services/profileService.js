import { supabase } from './supabaseClient';


// 1. Получить профиль пользователя
export const getMyProfile = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data;

  } catch (err) {
    console.error('Ошибка получения профиля:', err);
    throw err;
  }
};


// 2. Обновить данные профиля
export const updateProfile = async (userId, updates) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    return data;

  } catch (err) {
    console.error('Ошибка обновления профиля:', err);
    throw err;
  }
};


// 3. Загрузка аватара
export const uploadAvatar = async (userId, file) => {
  try {

    if (!file) {
      throw new Error('Файл не выбран');
    }


    // Проверка типа файла
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowedTypes.includes(file.type)) {
      throw new Error('Можно загрузить только JPG, PNG или WEBP');
    }


    // Ограничение 5 MB
    if (file.size > 5 * 1024 * 1024) {
      throw new Error('Размер файла не должен превышать 5MB');
    }


    const fileExt = file.name.split('.').pop();

    const fileName = `${userId}-${Date.now()}.${fileExt}`;

    const filePath = `avatars/${fileName}`;


    // Загружаем в Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true
      });


    if (uploadError) {
      throw uploadError;
    }


    // Получаем публичную ссылку
    const { data: urlData } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);


    const publicUrl = urlData.publicUrl;


    // Обновляем профиль
    const updatedProfile = await updateProfile(
      userId,
      {
        avatar_url: publicUrl
      }
    );


    return updatedProfile;


  } catch (err) {

    console.error('Ошибка загрузки аватара:', err);
    throw err;

  }
};