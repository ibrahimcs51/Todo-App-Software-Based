import axios from 'axios';
import Cookies from 'js-cookie';

const axiosInstance = axios.create({
  baseURL: 'https://todo-app-backend-inky.vercel.app/api' , 
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // ✅ VERY IMPORTANT
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
