<template>
  <div class="view-container">
    <h2>Catálogo de Productos</h2>
    <div class="grid">
      <div class="card" v-for="n in 4" :key="n">
        <div class="img-placeholder">📸 Imagen del Producto</div>
        <h3>Producto Técnico {{ n }}</h3>
        <p class="price">Q {{ n * 150 }}.00</p>
        <button class="btn-add">Añadir al Carrito</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.view-container { padding: 20px; max-width: 1000px; margin: 0 auto; }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; margin-top: 20px; }
.card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; background: white; }
.img-placeholder { height: 150px; background: #f0f0f0; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; color: #888; border-radius: 4px; }
.price { font-weight: bold; color: #d9534f; font-size: 1.2rem; }
.btn-add { background: #007bff; color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; width: 100%; margin-top: 10px; }
.btn-add:hover { background: #0056b3; }
</style>
