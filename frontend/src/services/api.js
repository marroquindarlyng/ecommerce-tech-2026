import axios from 'axios';

export const apiBaseURL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '');

const api = axios.create({
    baseURL: apiBaseURL,
    timeout: 5000
});

// Aquí a futuro se pueden agregar "Interceptors" para inyectar el Token JWT en cada petición

export default api;
