import React, { useState } from 'react';
import { updateProfile, uploadAvatar } from '../../services/profileService';

export default function ProfileModal({
  currentUser,
  profile,
  onClose,
  onUpdate,
  onLogout
}) {

  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');


  const handleAvatarChange = async (e) => {

    const file = e.target.files?.[0];

    if (!file) return;

    if (!currentUser?.id) {
      setError('Пользователь не найден');
      return;
    }


    setUploadingAvatar(true);
    setError('');


    try {

      const updated = await uploadAvatar(
        currentUser.id,
        file
      );


      setAvatarUrl(updated.avatar_url);

      if (onUpdate) {
        onUpdate(updated);
      }


    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        'Ошибка загрузки аватара'
      );


    } finally {

      setUploadingAvatar(false);

      // чтобы можно было выбрать тот же файл повторно
      e.target.value = '';

    }
  };



  const handleSave = async (e) => {

    e.preventDefault();


    if (!currentUser?.id) {
      setError('Пользователь не найден');
      return;
    }


    setLoading(true);
    setError('');


    try {

      const updated = await updateProfile(
        currentUser.id,
        {
          full_name: fullName.trim(),
          bio: bio.trim()
        }
      );


      if (onUpdate) {
        onUpdate(updated);
      }


      onClose();


    } catch (err) {

      console.error(err);

      setError(
        err.message ||
        'Ошибка сохранения профиля'
      );


    } finally {

      setLoading(false);

    }

  };



  const closeModal = () => {
    setError('');
    onClose();
  };



  return (

    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">


      <div className="
        w-full max-w-md
        bg-[#0f0d22]
        border border-[#242048]
        rounded-3xl
        p-6
        shadow-2xl
        text-white
        max-h-[90vh]
        overflow-y-auto
      ">


        <div className="flex justify-between items-center mb-6">

          <h3 className="text-lg font-bold">
            Настройки профиля
          </h3>


          <button
            onClick={closeModal}
            className="text-slate-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>

        </div>



        {error && (

          <div className="
            mb-4
            p-3
            bg-red-500/10
            border border-red-500/20
            text-red-400
            text-xs
            rounded-xl
            text-center
          ">
            {error}
          </div>

        )}




        {/* Аватар */}

        <div className="flex flex-col items-center mb-6">


          <div className="
            relative
            w-20 h-20
            rounded-2xl
            overflow-hidden
            bg-[#14122b]
            border border-[#242048]
          ">


            {avatarUrl ? (

              <img
                src={avatarUrl}
                alt="avatar"
                className="w-full h-full object-cover"
              />

            ) : (

              <div className="
                w-full h-full
                flex items-center justify-center
                text-2xl
              ">
                👤
              </div>

            )}



            {uploadingAvatar && (

              <div className="
                absolute inset-0
                bg-black/60
                flex items-center justify-center
                text-xs
              ">
                ...
              </div>

            )}

          </div>



          <label
            className={`
              mt-3
              text-xs
              font-semibold
              cursor-pointer
              ${uploadingAvatar 
                ? 'text-slate-500 cursor-not-allowed'
                : 'text-purple-400 hover:text-purple-300'}
            `}
          >

            {uploadingAvatar
              ? 'Загрузка...'
              : 'Изменить аватар'
            }


            {!uploadingAvatar && (

              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />

            )}

          </label>


        </div>





        <form
          onSubmit={handleSave}
          className="space-y-4"
        >



          <input
            type="text"
            value={fullName}
            onChange={(e)=>setFullName(e.target.value)}
            placeholder="Ваше имя"
            className="
              w-full
              bg-[#14122b]
              border border-[#242048]
              rounded-xl
              px-4 py-2.5
              text-xs
              text-white
              focus:outline-none
              focus:border-purple-500
            "
          />




          <textarea
            value={bio}
            onChange={(e)=>setBio(e.target.value)}
            placeholder="О себе..."
            rows="3"
            className="
              w-full
              bg-[#14122b]
              border border-[#242048]
              rounded-xl
              p-3
              text-xs
              resize-none
              focus:outline-none
              focus:border-purple-500
            "
          />





          <input
            disabled
            value={currentUser?.email || ''}
            className="
              w-full
              bg-[#14122b]/50
              border border-[#242048]
              rounded-xl
              px-4 py-2.5
              text-xs
              text-slate-500
            "
          />




          <div className="flex gap-3 pt-2">


            <button
              type="button"
              onClick={closeModal}
              className="
                flex-1
                bg-slate-800
                text-slate-300
                py-2.5
                rounded-xl
                text-xs
              "
            >
              Отмена
            </button>



            <button
              disabled={loading}
              className="
                flex-1
                bg-gradient-to-r
                from-violet-600
                to-indigo-600
                text-white
                py-2.5
                rounded-xl
                text-xs
                disabled:opacity-50
              "
            >

              {loading
                ? 'Сохранение...'
                : 'Сохранить'
              }

            </button>


          </div>


        </form>




        <div className="
          mt-6
          pt-4
          border-t border-[#242048]
        ">

          <button
            onClick={onLogout}
            className="
              w-full
              bg-red-500/10
              border border-red-500/20
              text-red-400
              py-2.5
              rounded-xl
              text-xs
            "
          >
            Выйти из аккаунта
          </button>


        </div>



      </div>


    </div>

  );
}