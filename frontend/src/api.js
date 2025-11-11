import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({ baseURL: API_URL })

// Add request interceptor to ensure token is always included
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle 401/403 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Token is invalid or expired
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
      // Redirect to login if we're in the browser
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const setAuthToken = (token) => {
  if(token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    console.log('Auth token set in headers');
  } else {
    delete api.defaults.headers.common['Authorization']
    console.log('Auth token removed from headers');
  }
}