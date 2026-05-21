import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase/config';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';

const ADMIN_EMAIL = 'admin@saver.in';
const AuthContext = createContext();
export const useAdminAuth = () => useContext(AuthContext);

export function AdminAuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setIsLoggedIn(!!(user && user.email === ADMIN_EMAIL));
      setLoading(false);
    });
    return unsub;
  }, []);

  const login = async (email, password) => {
    if (email !== ADMIN_EMAIL) return false;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (e) {
      console.error('Admin login error:', e.code, e.message);
      return false;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: '#085041'
    }}>
      <div style={{
        width: 32, height: 32,
        border: '3px solid rgba(255,255,255,0.3)',
        borderTopColor: 'white', borderRadius: '50%',
        animation: 'spin 0.7s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
