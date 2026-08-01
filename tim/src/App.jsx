import React, { useState, useEffect } from 'react';
import Login from './components/auth/Login';
import Messenger from './components/chat/Messenger';
import { getCurrentUser, logoutUser } from './services/authService';

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = getCurrentUser();
    if (savedUser) {
      setUser(savedUser);
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    setUser(null);
  };

  return (
    <div>
      {!user ? (
        <Login onLoginSuccess={(loggedInUser) => setUser(loggedInUser)} />
      ) : (
        <Messenger currentUser={user} onLogout={handleLogout} />
      )}
    </div>
  );
}
