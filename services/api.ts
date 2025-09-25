import axios from 'axios';

// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.1.203:8000/api';
// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.15.39.44:8000/api';
// const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.167.163:8000/api';


export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log('API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);