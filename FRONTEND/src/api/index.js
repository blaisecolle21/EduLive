import axios from 'axios';


const api = axios.create({
  baseURL: 'http://localhost:6300/api',
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json'}
});

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
