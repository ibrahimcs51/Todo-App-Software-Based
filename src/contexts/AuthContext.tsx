// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import axiosInstance from '@/lib/axiosInstance';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ start as true
  const navigate = useNavigate();

  const login = async ({ email, password }) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/login', { email, password });
      const { token, user } = res.data;

      if (!token || !user) {
        throw new Error("Invalid credentials");
      }

      Cookies.set('token', token, {
        expires: 7,
        sameSite: 'strict',
        path: '/',
      });

      setUser(user);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login failed:', err);
      const message = err?.response?.data?.message || 'Invalid email or password';
      alert('Login failed: ' + message);
    } finally {
      setLoading(false);
    }
  };

  const register = async ({ name, email, password }) => {
    setLoading(true);
    try {
      const res = await axiosInstance.post('/auth/register', { name, email, password });
      const { token, user } = res.data;

      Cookies.set('token', token);
      setUser(user);
    } catch (err) {
      console.error('Register failed:', err);
      alert('Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    Cookies.remove('token');
    setUser(null);
    navigate('/auth'); // ✅ optional
  };

  // ✅ Handle refresh properly
  useEffect(() => {
    const token = Cookies.get('token');
    console.log('🔍 Token in cookies:', token);
    setLoading(true); // ✅ Set loading immediately

    if (token) {
      axiosInstance.get('/auth/me')
        .then((res) => {
          console.log('✅ /auth/me success:', res.data);
          setUser(res.data);
        })
        .catch((err) => {
          console.error('❌ /auth/me error:', err.response?.status, err.response?.data);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setUser(null);
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};
