import { createContext, useContext, useEffect, useState } from 'react';
import { appEnv } from '../config/env';

const AuthContext = createContext(null);

async function authRequest(path, options = {}) {
  const response = await fetch(`${appEnv.apiBaseUrl}/auth/${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message || 'Authentication request failed.');
  return payload;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    authRequest('session')
      .then(({ user: sessionUser }) => active && setUser(sessionUser))
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const login = async (email, password) => {
    const result = await authRequest('login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setUser(result.user);
    return result.user;
  };

  const register = async (name, email, password) => {
    const result = await authRequest('register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    setUser(result.user);
    return result.user;
  };

  const logout = async () => {
    await authRequest('logout', { method: 'POST' }).catch(() => {});
    setUser(null);
  };

  const updateUserProfile = async ({ displayName, photoURL }) => {
    const result = await authRequest('profile', {
      method: 'PATCH',
      body: JSON.stringify({ displayName, photoURL }),
    });
    setUser(result.user);
    return result.user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        updateUserProfile,
        isAdmin: user?.isAdmin === true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
