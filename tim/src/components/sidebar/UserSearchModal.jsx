import React, { useState } from 'react';
import { searchUsersByUsername } from '../../services/userService';

export default function UserSearchModal({
  currentUser,
  onClose,
  onSelectUser,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();

    if (query.trim().length < 2) {
      setError('Введите минимум 2 символа');
      return;
    }

    setLoading(true);
    setSearched(true);
    setError('');

    try {
      const users = await searchUsersByUsername(
        query,
        currentUser.id
      );

      setResults(users);
    } catch (err) {
      console.error(err);
      setError('Ошибка поиска пользователей');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

      <div className="w-full max-w-md max-h-[80vh] rounded-3xl border border-[#242048] bg-[#0f0d22] p-6 shadow-2xl text-white flex flex-col">

        {/* Заголовок */}
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold">
            Поиск пользователей
          </h3>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition"
          >
            ✕
          </button>
        </div>

        {/* Поиск */}
        <form
          onSubmit={handleSearch}
          className="flex gap-2 mb-4"
        >
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-slate-500">
              @
            </span>

            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="username"
              className="w-full rounded-xl border border-[#242048] bg-[#14122b] pl-8 pr-4 py-2.5 text-xs text-white outline-none focus:border-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-xs font-semibold shadow-lg shadow-purple-600/30 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-50"
          >
            {loading ? '...' : 'Найти'}
          </button>
        </form>

        {/* Ошибка */}
        {error && (
          <div className="mb-3 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-center text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Список */}
        <div className="flex-1 overflow-y-auto space-y-2">

          {loading && (
            <div className="py-8 text-center text-xs text-slate-400">
              Ищем пользователей...
            </div>
          )}

          {!loading &&
            searched &&
            results.length === 0 &&
            !error && (
              <div className="py-8 text-center text-xs text-slate-400">
                Никого не найдено 😔
              </div>
            )}

          {!loading &&
            results.map((user) => (
              <div
                key={user.id}
                onClick={() => onSelectUser(user)}
                className="cursor-pointer rounded-2xl border border-[#242048] bg-[#14122b] p-3 transition hover:border-purple-500/50 hover:bg-[#181533]"
              >
                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">

                    <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-purple-600/20 text-sm font-bold text-purple-300">

                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        user.username
                          .substring(0, 2)
                          .toUpperCase()
                      )}

                    </div>

                    <div>

                      <h4 className="text-xs font-bold text-white">
                        {user.full_name || user.username}
                      </h4>

                      <p className="text-[11px] text-purple-400">
                        @{user.username}
                      </p>

                      {user.bio && (
                        <p className="mt-1 max-w-[180px] truncate text-[10px] text-slate-500">
                          {user.bio}
                        </p>
                      )}

                    </div>

                  </div>

                  <div className="flex flex-col items-end gap-2">

                    <span
                      className={`text-[10px] ${
                        user.is_online
                          ? 'text-emerald-400'
                          : 'text-slate-500'
                      }`}
                    >
                      {user.is_online
                        ? '🟢 В сети'
                        : '⚪ Не в сети'}
                    </span>

                    <span className="rounded-lg bg-white/5 px-3 py-1 text-[11px] text-slate-300">
                      Написать
                    </span>

                  </div>

                </div>
              </div>
            ))}
        </div>

      </div>

    </div>
  );
}