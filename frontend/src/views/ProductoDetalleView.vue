<template>
  <div class="detalle-contenedor">
    <button class="btn-volver" @click="volverAlCatalogo">← Volver al Catálogo</button>

    <div v-if="producto" class="producto-layout">
      <div class="producto-visual">
        <div class="imagen-principal">
          <img :src="producto.imagen" :alt="producto.nombre">
        </div>
      </div>

      <div class="producto-info">
        <span class="categoria-etiqueta">Componente Grado Industrial</span>
        <h1 class="producto-titulo">{{ producto.nombre }}</h1>
        <p class="producto-precio">Q {{ producto.precio.toLocaleString('es-GT', {minimumFractionDigits: 2}) }}</p>
        
        <div class="estado-inventario">
          <span :class="producto.stock > 0 ? 'dot-verde' : 'dot-rojo'"></span>
          {{ producto.stock > 0 ? `En stock (${producto.stock} unidades)` : 'Agotado' }}
        </div>

        <p class="producto-descripcion">{{ producto.descripcion }}</p>

        <div class="especificaciones">
          <h3>Especificaciones Técnicas</h3>
          <ul>
            <li v-for="(valor, clave) in producto.especificaciones" :key="clave">
              <span class="spec-clave">{{ clave }}</span>
              <span class="spec-valor">{{ valor }}</span>
            </li>
          </ul>
        </div>

        <div class="controles-compra">
          <button class="btn-primario" :disabled="producto.stock === 0">
            {{ producto.stock > 0 ? 'Añadir al Carrito' : 'Sin Inventario' }}
          </button>
        </div>
      </div>
    </div>
    
    <div v-else class="cargando">
      <p>Cargando especificaciones del producto...</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const route = useRoute();
const router = useRouter();
const producto = ref(null);

// Simulación de respuesta de base de datos basada en el ID recibido en la URL
const cargarProducto = () => {
  const idSolicitado = parseInt(route.params.id);
  
  // Simulamos el JSON que enviará Node.js
  producto.value = {
    id_producto: idSolicitado,
    nombre: 'Intel Core i9-14900K Processor',
    precio: 5200.00,
    stock: 12,
    imagen: 'http://googleusercontent.com/image_collection/image_retrieval/4211281548323305122',
    descripcion: 'Procesador de arquitectura híbrida diseñado para cargas de trabajo extremas, compilación de código y renderizado 3D de alta exigencia térmica.',
    especificaciones: {
      'Núcleos / Hilos': '24 (8P + 16E) / 32 Hilos',
      'Frecuencia Base': '3.2 GHz',
      'Frecuencia Turbo': '6.0 GHz',
      'Caché L3': '36 MB Intel Smart Cache',
      'TDP Base': '125 W',
      'Socket Compatibles': 'LGA 1700'
    }
  };
};

const volverAlCatalogo = () => {
  router.push('/catalogo');
};

onMounted(() => {
  cargarProducto();
});
</script>

<style scoped>
.detalle-contenedor {
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
}

.btn-volver {
  background: transparent;
  border: none;
  color: #8C8C8C;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-bottom: 30px;
  padding: 0;
  transition: color 0.3s;
}

.btn-volver:hover { color: #1E1E1E; }

.producto-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
}

.producto-visual {
  background: #F9F9F9;
  border: 1px solid #EDEDED;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  height: fit-content;
}

.imagen-principal img {
  width: 100%;
  max-width: 450px;
  height: auto;
}

.categoria-etiqueta {
  font-size: 0.75rem;
  color: #B0B0B0;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 1px;
}

.producto-titulo {
  font-size: 2.2rem;
  font-weight: 800;
  color: #1E1E1E;
  margin: 10px 0 20px 0;
  line-height: 1.2;
  letter-spacing: -1px;
}

.producto-precio {
  font-size: 1.8rem;
  font-weight: 700;
  color: #1E1E1E;
  margin-bottom: 20px;
}

.estado-inventario {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  font-weight: 600;
  color: #4A4A4A;
  margin-bottom: 30px;
}

.dot-verde { height: 10px; width: 10px; background-color: #2E7D32; border-radius: 50%; display: inline-block; margin-right: 8px; }
.dot-rojo { height: 10px; width: 10px; background-color: #D32F2F; border-radius: 50%; display: inline-block; margin-right: 8px; }

.producto-descripcion {
  font-size: 1rem;
  line-height: 1.6;
  color: #666;
  margin-bottom: 40px;
}

.especificaciones {
  border-top: 1px solid #EEE;
  padding-top: 30px;
  margin-bottom: 40px;
}

.especificaciones h3 {
  font-size: 1.2rem;
  color: #1E1E1E;
  margin-bottom: 20px;
}

.especificaciones ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.especificaciones li {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #F5F5F5;
  font-size: 0.9rem;
}

.spec-clave { color: #8C8C8C; font-weight: 600; }
.spec-valor { color: #1E1E1E; font-weight: 600; text-align: right; }

.controles-compra {
  display: flex;
  gap: 20px;
}

.btn-primario {
  flex: 1;
  background: #1E1E1E;
  color: white;
  border: none;
  padding: 18px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  border-radius: 2px;
  transition: opacity 0.3s;
}

.btn-primario:hover { opacity: 0.9; }
.btn-primario:disabled { background: #E0E0E0; color: #999; cursor: not-allowed; }

@media (max-width: 900px) {
  .producto-layout { grid-template-columns: 1fr; gap: 40px; }
}
</style>