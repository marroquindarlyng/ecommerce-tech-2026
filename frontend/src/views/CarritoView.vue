<template>
  <div class="checkout-container">
    <div class="checkout-grid">
      <section class="cart-items">
        <h2 class="section-title">Tu Selección</h2>
        <div class="cart-list">
          <div class="cart-item" v-for="item in carritoSimulado" :key="item.id_producto">
            <div class="item-thumb">
              <img :src="item.imagen" alt="Thumbnail">
            </div>
            <div class="item-info">
              <h4>{{ item.nombre }}</h4>
              <span class="sku">ID: #00{{ item.id_producto }}</span>
            </div>
            <div class="item-qty">
              <button class="qty-btn">-</button>
              <span class="qty-val">{{ item.cantidad }}</span>
              <button class="qty-btn">+</button>
            </div>
            <div class="item-price">
              Q {{ (item.precio * item.cantidad).toLocaleString() }}
            </div>
          </div>
        </div>
      </section>

      <aside class="order-summary">
        <div class="summary-box">
          <h3>Resumen de Orden</h3>
          <div class="summary-line">
            <span>Subtotal</span>
            <span>Q {{ calcularSubtotal().toLocaleString() }}</span>
          </div>
          <div class="summary-line">
            <span>Logística & Envío</span>
            <span>Q 35.00</span>
          </div>
          <div class="divider"></div>
          <div class="summary-line total">
            <span>Total Final</span>
            <span>Q {{ (calcularSubtotal() + 35).toLocaleString() }}</span>
          </div>
          <button class="checkout-btn">Finalizar Adquisición</button>
          <p class="secure-note">🛡️ Transacción encriptada y segura</p>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const carritoSimulado = ref([
  { id_producto: 1, nombre: 'Intel Core i9-14900K Processor', precio: 5200.00, cantidad: 1, imagen: 'http://googleusercontent.com/image_collection/image_retrieval/4211281548323305122' },
  { id_producto: 4, nombre: 'Samsung 990 Pro 2TB NVMe SSD', precio: 1650.00, cantidad: 2, imagen: 'http://googleusercontent.com/image_collection/image_retrieval/1053402543148818950' }
]);

const calcularSubtotal = () => {
  return carritoSimulado.value.reduce((t, i) => t + (i.precio * i.cantidad), 0);
};
</script>

<style scoped>
.checkout-container { max-width: 1200px; margin: 0 auto; padding: 60px 20px; }
.checkout-grid { display: grid; grid-template-columns: 1fr 380px; gap: 60px; }

.section-title { font-size: 1.8rem; font-weight: 800; letter-spacing: -1px; margin-bottom: 30px; }

.cart-list { display: flex; flex-direction: column; }
.cart-item { display: grid; grid-template-columns: 80px 1fr 120px 120px; align-items: center; padding: 25px 0; border-bottom: 1px solid #EEE; }

.item-thumb { width: 80px; height: 80px; background: #F9F9F9; border-radius: 4px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
.item-thumb img { width: 70%; height: auto; }

.item-info { padding-left: 20px; }
.item-info h4 { margin: 0; font-size: 1rem; font-weight: 600; color: #1E1E1E; }
.sku { font-size: 0.75rem; color: #B0B0B0; font-weight: 600; }

.qty-btn { background: none; border: 1px solid #DDD; width: 30px; height: 30px; cursor: pointer; color: #1E1E1E; font-weight: bold; border-radius: 2px; }
.qty-val { margin: 0 15px; font-weight: 600; font-size: 0.9rem; }

.item-price { text-align: right; font-weight: 700; color: #1E1E1E; }

.summary-box { background: white; border: 1px solid #1E1E1E; padding: 40px; border-radius: 2px; position: sticky; top: 40px; }
.summary-box h3 { margin-top: 0; font-size: 1.4rem; margin-bottom: 30px; font-weight: 800; letter-spacing: -0.5px; }

.summary-line { display: flex; justify-content: space-between; margin-bottom: 15px; color: #666; font-size: 0.95rem; }
.total { color: #1E1E1E; font-weight: 800; font-size: 1.2rem; margin-top: 25px; }
.divider { height: 1px; background: #EEE; margin: 20px 0; }

.checkout-btn { width: 100%; background: #1E1E1E; color: white; border: none; padding: 18px; font-weight: 700; font-size: 1rem; cursor: pointer; margin-top: 20px; transition: opacity 0.3s; }
.checkout-btn:hover { opacity: 0.9; }

.secure-note { text-align: center; font-size: 0.75rem; color: #AAA; margin-top: 20px; }

@media (max-width: 900px) {
  .checkout-grid { grid-template-columns: 1fr; }
  .summary-box { position: static; }
}
</style>