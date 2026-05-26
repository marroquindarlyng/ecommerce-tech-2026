import axios from 'axios';

// Creamos una instancia preconfigurada
const api = axios.create({
    baseURL: 'http://localhost:3000/api', // URL base de tu Node.js
    timeout: 5000, // Si el backend no responde en 5 segundos, aborta
    headers: {
        'Content-Type': 'application/json'
    }
});

// Aquí a futuro se pueden agregar "Interceptors" para inyectar el Token JWT en cada petición

export default api;