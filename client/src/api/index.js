// Shared axios instance. Injects the admin bearer token; hard-redirects to the
// admin login on 401. (Storefront calls are public and unaffected.)
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 20_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cel_admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401 && window.location.pathname.startsWith('/admin')) {
      localStorage.removeItem('cel_admin_token');
      if (window.location.pathname !== '/admin/login') window.location.assign('/admin/login');
    }
    return Promise.reject(err);
  }
);

export default api;
