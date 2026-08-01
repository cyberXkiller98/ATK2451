import React, { useState } from 'react';
import { loginUser, registerUser } from '../../services/authService';

export default function Login({ onSwitchToRegister, onLoginSuccess }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!identifier.trim()) {
      setError('Введите имя пользователя');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser(identifier, password);
      if (onLoginSuccess) onLoginSuccess(res.user);
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080711] text-slate-100 flex items-center justify-center p-4 md:p-8 font-sans relative overflow-x-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-4xl bg-[#0f0d22] border border-[#242048] rounded-3xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        
        {/* Левая колонка */}
        <div className="lg:col-span-5 p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#242048] bg-gradient-to-b from-purple-950/20 to-transparent">
          <div>
            <div className="relative w-20 h-20 mb-6 mx-auto lg:mx-0">
              <div className="absolute inset-0 bg-purple-500/30 rounded-full blur-xl" />
              <div className="relative w-full h-full bg-gradient-to-tr from-violet-600 to-indigo-500 rounded-3xl flex items-center justify-center shadow-lg shadow-purple-500/30 text-2xl">
                💬
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight">
              С возвращением в <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-300">Messenger</span>
            </h1>
            <p className="text-slate-400 text-xs mt-2 leading-relaxed">
              Войдите по своему никнейму, чтобы продолжить общение.
            </p>
          </div>
        </div>

        {/* Правая колонка */}
        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col justify-center">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 rounded-full bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 text-sm shadow-lg shadow-purple-500/20">
              🔑
            </div>
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Вход в аккаунт</h2>
            <p className="text-slate-400 text-xs mt-1">Введите ваше имя пользователя</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1 ml-1">Имя пользователя (никнейм)</label>
              <input 
                type="text" 
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="timur_dev"
                className="w-full bg-[#14122b] border border-[#242048] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-purple-600/30 text-xs flex items-center justify-center gap-2 mt-4 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Входим...' : 'Войти в аккаунт'}</span>
              <span>→</span>
            </button>

            <div className="relative my-4 text-center">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-[#242048]" /></div>
              <span className="relative bg-[#0f0d22] px-3 text-[11px] text-slate-500">или</span>
            </div>

            <div className="p-3 bg-[#14122b] border border-[#242048] rounded-xl text-center text-xs text-slate-300">
              Ещё нет аккаунта?{' '}
              <button type="button" onClick={onSwitchToRegister} className="text-purple-400 font-semibold hover:underline ml-1 cursor-pointer">
                Зарегистрироваться
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
