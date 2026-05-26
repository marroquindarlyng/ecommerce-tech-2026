<template>
  <div class="page-container">
    <header class="view-header">
      <h2 class="title">Arquitectura de Hardware</h2>
      <p class="subtitle">Componentes de alto rendimiento seleccionados para la próxima generación.</p>
    </header>
    
    <div class="product-grid">
      <div class="product-card" v-for="p in productosSimulados" :key="p.id_producto">
        <div class="product-visual">
          <div class="badge" v-if="p.stock > 10">Popular</div>
          <img :src="p.imagen" :alt="p.nombre">
        </div>
        
        <div class="product-info">
          <span class="category">Premium Component</span>
          <h3>{{ p.nombre }}</h3>
          <div class="footer-card">
            <span class="price">Q {{ p.precio.toLocaleString('es-GT', {minimumFractionDigits: 2}) }}</span>
            <button class="add-btn" :disabled="p.stock === 0">
              <span v-if="p.stock > 0">Añadir</span>
              <span v-else>Agotado</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const productosSimulados = ref([
  { id_producto: 1, nombre: 'Intel Core i9-14900K Processor', precio: 5200.00, stock: 12, imagen: 'http://googleusercontent.com/image_collection/image_retrieval/4211281548323305122' },
  { id_producto: 2, nombre: 'NVIDIA RTX 4090 Founders Edition', precio: 18500.00, stock: 3, imagen: 'http://googleusercontent.com/image_collection/image_retrieval/4061579238287819850' },
  { id_producto: 3, nombre: 'ASUS ROG Maximus Z790 Hero', precio: 6100.00, stock: 8, imagen: 'http://googleusercontent.com/image_collection/image_retrieval/13207192106555462465' },
  { id_producto: 4, nombre: 'Samsung 990 Pro 2TB NVMe SSD', precio: 1650.00, stock: 25, imagen: 'http://googleusercontent.com/image_collection/image_retrieval/1053402543148818950' }
]);
</script>

<style scoped>
.page-container { max-width: 1300px; margin: 0 auto; padding: 40px 20px; }
.view-header { margin-bottom: 50px; }
.title { font-size: 2.5rem; font-weight: 800; letter-spacing: -1.5px; color: #1E1E1E; margin-bottom: 10px; }
.subtitle { color: #8C8C8C; font-size: 1.1rem; }

.product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 30px; }
.product-card { background: white; border: 1px solid #EDEDED; border-radius: 4px; transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1); position: relative; }
.product-card:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.04); border-color: #D1D1D1; }

.product-visual { height: 280px; background: #F9F9F9; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.product-visual img { width: 85%; height: auto; transition: transform 0.5s ease; }
.product-card:hover .product-visual img { transform: scale(1.05); }

.badge { position: absolute; top: 15px; right: 15px; background: #1E1E1E; color: white; padding: 4px 12px; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; z-index: 2; }

.product-info { padding: 25px; }
.category { font-size: 0.75rem; color: #B0B0B0; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; margin-bottom: 8px; display: block; }
.product-info h3 { font-size: 1.1rem; margin: 0 0 20px 0; font-weight: 600; line-height: 1.4; color: #1E1E1E; }

.footer-card { display: flex; justify-content: space-between; align-items: center; }
.price { font-size: 1.3rem; font-weight: 700; color: #1E1E1E; }

.add-btn { background: #1E1E1E; color: white; border: none; padding: 10px 20px; font-weight: 600; cursor: pointer; transition: background 0.3s; border-radius: 2px; }
.add-btn:hover { background: #333; }
.add-btn:disabled { background: #E0E0E0; cursor: not-allowed; }
</style>