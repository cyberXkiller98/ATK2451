import React, { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Messenger from './components/chat/Messenger';

import { supabase } from './services/supabaseClient';
import { logoutUser } from './services/authService';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);
        setCurrentScreen('messenger');
      }

      setLoading(false);
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setCurrentScreen('messenger');
      } else {
        setUser(null);
        setCurrentScreen('login');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#080711] text-white text-sm">
        Загрузка...
      </div>
    );
  }

  return (
    <>
      {currentScreen === 'login' && (
        <Login
          onSwitchToRegister={() => setCurrentScreen('register')}
          onLoginSuccess={() => setCurrentScreen('messenger')}
        />
      )}

      {currentScreen === 'register' && (
        <Register
          onSwitchToLogin={() => setCurrentScreen('login')}
          onRegisterSuccess={() => setCurrentScreen('messenger')}
        />
      )}

      {currentScreen === 'messenger' && (
        <Messenger
          currentUser={user}
          onLogout={logoutUser}
        />
      )}
    </>
  );
}