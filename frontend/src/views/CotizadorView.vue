<template>
  <div class="cotizador-container">
    <header class="view-header">
      <h2 class="title">Configurador de Sistemas</h2>
      <p class="subtitle">Seleccione componentes de grado industrial para su arquitectura personalizada.</p>
    </header>

    <div class="cotizador-grid">
      <section class="configuracion">
        <div v-for="(categoria, index) in categorias" :key="index" class="categoria-card">
          <label>{{ categoria.nombre }}</label>
          <select 
            v-model="configuracion[categoria.key]" 
            @change="actualizarTotalConcurrente"
            :disabled="calculando"
          >
            <option :value="null">Seleccione una opción...</option>
            <option v-for="opcion in categoria.opciones" :key="opcion.id" :value="opcion">
              {{ opcion.nombre }} (+ Q {{ opcion.precio }})
            </option>
          </select>
        </div>
      </section>

      <aside class="resultado-panel">
        <div class="resumen-total" :class="{ 'calculando-overlay': calculando }">
          <span class="label-total">Presupuesto Estimado</span>
          <h3 class="monto-total">Q {{ total.toLocaleString('es-GT', {minimumFractionDigits: 2}) }}</h3>
          
          <div class="detalles-config">
            <p v-for="(val, key) in configuracion" :key="key">
              <span v-if="val">✔ {{ val.nombre }}</span>
            </p>
          </div>

          <button class="btn-solicitar" :disabled="calculando || total === 0">
            {{ calculando ? 'Procesando...' : 'Generar Orden de Compra' }}
          </button>
          <small class="concurrencia-info" v-if="calculando">Protección de concurrencia activa...</small>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const calculando = ref(false);
const total = ref(0);

// Estructura de datos para el cotizador
const categorias = [
  { nombre: 'Unidad de Procesamiento (CPU)', key: 'cpu', opciones: [
    { id: 1, nombre: 'Intel Core i9-14900K', precio: 5200 },
    { id: 2, nombre: 'AMD Ryzen 9 7950X', precio: 4800 }
  ]},
  { nombre: 'Memoria de Acceso Aleatorio (RAM)', key: 'ram', opciones: [
    { id: 3, nombre: '32GB DDR5 6000MHz', precio: 1200 },
    { id: 4, nombre: '64GB DDR5 6400MHz', precio: 2400 }
  ]},
  { nombre: 'Acelerador Gráfico (GPU)', key: 'gpu', opciones: [
    { id: 5, nombre: 'NVIDIA RTX 4090', precio: 18500 },
    { id: 6, nombre: 'NVIDIA RTX 4080 Super', precio: 11000 }
  ]}
];

const configuracion = reactive({
  cpu: null,
  ram: null,
  gpu: null
});

// Lógica para manejar concurrencia en la UI
// Simulamos un proceso pesado para probar que el usuario no puede romper el flujo
let timeoutConcurrencia = null;

const actualizarTotalConcurrente = () => {
  calculando.value = true;
  
  // Limpiamos cualquier cálculo pendiente (Debouncing)
  // Si el usuario cambia 5 opciones en 1 segundo, solo se procesa la última
  clearTimeout(timeoutConcurrencia);

  timeoutConcurrencia = setTimeout(() => {
    let nuevoTotal = 0;
    Object.values(configuracion).forEach(item => {
      if (item) nuevoTotal += item.precio;
    });
    
    total.ref = nuevoTotal; // Actualizamos el estado
    total.value = nuevoTotal;
    calculando.value = false; // Liberamos la UI
  }, 600); // Simulamos 600ms de latencia de lógica
};
</script>

<style scoped>
.cotizador-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
.view-header { margin-bottom: 50px; border-bottom: 1px solid #EEE; padding-bottom: 20px; }
.title { font-size: 2.2rem; font-weight: 800; letter-spacing: -1px; color: #1E1E1E; }
.subtitle { color: #8C8C8C; font-size: 1rem; }

.cotizador-grid { display: grid; grid-template-columns: 1fr 350px; gap: 50px; }

.categoria-card { margin-bottom: 30px; display: flex; flex-direction: column; }
.categoria-card label { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #B0B0B0; margin-bottom: 10px; }

select {
  padding: 15px;
  border: 1px solid #EDEDED;
  background: white;
  font-family: inherit;
  font-size: 1rem;
  color: #1E1E1E;
  border-radius: 2px;
  cursor: pointer;
  outline: none;
}

select:focus { border-color: #1E1E1E; }

.resultado-panel { position: sticky; top: 40px; height: fit-content; }
.resumen-total { background: #1E1E1E; color: white; padding: 40px; border-radius: 4px; transition: opacity 0.3s; }
.calculando-overlay { opacity: 0.7; pointer-events: none; }

.label-total { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 2px; opacity: 0.6; }
.monto-total { font-size: 2rem; font-weight: 800; margin: 10px 0 30px 0; color: #F7F7F7; }

.detalles-config { margin-bottom: 30px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 20px; }
.detalles-config p { font-size: 0.9rem; margin-bottom: 8px; color: #CCC; }

.btn-solicitar {
  width: 100%;
  padding: 15px;
  background: #2E7D32;
  color: white;
  border: none;
  font-weight: 700;
  cursor: pointer;
  border-radius: 2px;
}

.btn-solicitar:disabled { background: #444; cursor: not-allowed; }
.concurrencia-info { display: block; margin-top: 10px; font-size: 0.7rem; color: #8C8C8C; text-align: center; }

@media (max-width: 850px) {
  .cotizador-grid { grid-template-columns: 1fr; }
}
</style>