import React, { createContext, useContext, useState } from 'react';

// Simple admin auth — hardcoded credentials
// Change these to your own secure password before deploying!
const ADMIN_EMAIL = 'admin@saver.in';
const ADMIN_PASSWORD = 'SaverAdmin@2025';

const AuthContext = createContext();
export const useAdminAuth = () => useContext(AuthContext);

export function AdminAuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(
    () => sessionStorage.getItem('saver_admin') === 'true'
  );

  const login = (email, password) => {
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      sessionStorage.setItem('saver_admin', 'true');
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    sessionStorage.removeItem('saver_admin');
    setIsLoggedIn(false);
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
