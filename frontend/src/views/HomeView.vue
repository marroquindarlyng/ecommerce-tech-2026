<template>
  <div class="view-container">
    <h2>Bienvenido a Ecommerce Tech 2026</h2>
    <p>Encuentra los mejores componentes de hardware y tecnología.</p>
    
    <div class="status-panel" v-if="datosBackend">
      <small>🟢 API Conectada: {{ datosBackend.mensaje }}</small>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import api from '../services/api';

const datosBackend = ref(null);

onMounted(async () => {
  try {
    const res = await api.get('/health');
    datosBackend.value = res.data;
  } catch (e) {
    console.error("Backend inactivo");
  }
});
</script>

<style scoped>
.view-container { text-align: center; padding: 40px 20px; }
.status-panel { margin-top: 20px; padding: 10px; background: #e8f5e9; border-radius: 4px; display: inline-block; }
</style>