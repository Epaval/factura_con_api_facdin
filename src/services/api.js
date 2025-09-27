// services/api.js
import axios from 'axios';

// Usar la variable de entorno o el valor por defecto
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api';
const API_KEY = import.meta.env.VITE_FACDIN_API_KEY;

console.log('🔧 Configuración API Local:', {
  baseURL: API_BASE_URL,
  hasApiKey: !!API_KEY
});

// Crear instancia de axios
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000, // 10 segundos de timeout
});

// Interceptor para agregar headers automáticamente
api.interceptors.request.use((config) => {
  // Agregar x-api-key desde variables de entorno
  if (API_KEY) {
    config.headers['x-api-key'] = API_KEY;
  }
  
  // Agregar token de autenticación si existe
  const token = localStorage.getItem('facdin_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('📤 Request:', config.method?.toUpperCase(), config.url);
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para respuestas
api.interceptors.response.use(
  (response) => {
    console.log('✅ Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Error:', error.response?.status, error.config?.url, error.message);
    
    // Manejar errores de autenticación
    if (error.response?.status === 401) {
      localStorage.removeItem('facdin_token');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);