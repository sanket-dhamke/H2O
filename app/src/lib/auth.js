import React, { createContext, useContext, useEffect, useState } from "react";
import { api, setToken, getToken } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (token) {
          const { user } = await api.me();
          setUser(user);
        }
      } catch {
        await setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { token, user } = await api.login(email, password);
    await setToken(token);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
