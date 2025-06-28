// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import jwtDecode from 'jwt-decode'; // ✅ Install: npm install jwt-decode

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      const { token, user } = res.data;

      if (!token || !user) throw new Error("Invalid credentials");

      Cookies.set('token', token, {
        expires: 7,
        sameSite: 'strict',
        path: '/',
      });

      setUser(user);
    } catch (err) {
      console.error('Login failed:', err);
      alert('Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
  };

  useEffect(() => {
    const token = Cookies.get('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        // You can include user info inside token when generating it on backend
        setUser(decoded); // Set user from decoded token
      } catch (err) {
        console.error("Token decode error:", err);
        Cookies.remove('token');
        setUser(null);
      }
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
