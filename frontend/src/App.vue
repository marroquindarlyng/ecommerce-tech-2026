<template>
  <div style="font-family: Arial, sans-serif; padding: 20px; text-align: center;">
    <h1>🛒 Ecommerce Tech 2026</h1>
    <h3 style="color: #42b883;">Entorno de Vue.js y Vite inicializado con éxito</h3>
    
    <div style="margin: 30px auto; max-width: 500px; padding: 20px; border: 1px solid #ddd; border-radius: 8px; text-align: left; background-color: #f9f9f9;">
      <h4 style="margin-top: 0; color: #333;">📡 Prueba de Conexión Backend</h4>
      
      <p v-if="cargando" style="color: #666;">Intentando conectar con Node.js...</p>
      
      <div v-else-if="error" style="color: #d9534f; font-weight: bold;">
        {{ error }}
      </div>
      
      <div v-else style="color: #5cb85c;">
        <p><strong>Estado:</strong> {{ datosBackend.estado }}</p>
        <p><strong>Mensaje:</strong> {{ datosBackend.mensaje }}</p>
        <p style="font-size: 0.8em; color: #888;"><strong>Timestamp:</strong> {{ datosBackend.timestamp }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from './services/api'; // Importamos la instancia configurada

// Variables reactivas para manejar el estado de la interfaz
const datosBackend = ref(null);
const error = ref(null);
const cargando = ref(true);

// Función asíncrona para consultar el servidor
const verificarConexion = async () => {
  try {
    // Al usar api.js, la ruta completa se traduce a http://localhost:3000/api/health
    const respuesta = await api.get('/health');
    datosBackend.value = respuesta.data;
  } catch (err) {
    console.error('Fallo en la petición HTTP:', err);
    error.value = 'Conexión rechazada. Asegúrate de que el servidor Node.js esté encendido.';
  } finally {
    cargando.value = false;
  }
};

// Se ejecuta automáticamente cuando el componente se monta en el navegador
onMounted(() => {
  verificarConexion();
});
</script>