<template>
  <section class="cart-page">
    <header class="cart-header">
      <div>
        <span class="eyebrow">Carrito</span>
        <h1>Tu seleccion</h1>
        <p>{{ totalItems }} {{ totalItems === 1 ? 'articulo listo' : 'articulos listos' }} para compra.</p>
      </div>

      <RouterLink to="/catalogo" class="continue-link">Seguir comprando</RouterLink>
    </header>

    <div v-if="items.length === 0" class="empty-state">
      <strong>Tu carrito esta vacio</strong>
      <p>Explora el catalogo y agrega productos disponibles para preparar tu orden.</p>
      <RouterLink to="/catalogo">Ver catalogo</RouterLink>
    </div>

    <div v-else class="checkout-grid">
      <section class="cart-list" aria-label="Productos en carrito">
        <article v-for="item in items" :key="item.id_producto" class="cart-item">
          <div class="item-thumb">
            <img v-if="item.imagen" :src="item.imagen" :alt="item.nombre">
            <div v-else class="thumb-fallback">{{ iniciales(item.nombre) }}</div>
          </div>

          <div class="item-info">
            <span>{{ item.categoria || 'Sin categoria' }}</span>
            <h2>{{ item.nombre }}</h2>
            <code>{{ item.codigo_sku || `ID ${item.id_producto}` }}</code>
          </div>

          <div class="qty-control" aria-label="Cantidad">
            <button
              type="button"
              class="icon-button"
              aria-label="Restar cantidad"
              @click="decrementQuantity(item.id_producto)"
            >
              -
            </button>
            <input
              :value="item.cantidad"
              type="number"
              min="1"
              :max="item.stock"
              @change="actualizarCantidad(item.id_producto, $event.target.value)"
            >
            <button
              type="button"
              class="icon-button"
              aria-label="Sumar cantidad"
              :disabled="item.cantidad >= item.stock"
              @click="incrementQuantity(item.id_producto)"
            >
              +
            </button>
          </div>

          <div class="item-total">
            <span>{{ formatoMoneda(item.precio) }} c/u</span>
            <strong>{{ formatoMoneda(item.precio * item.cantidad) }}</strong>
            <small>{{ item.stock }} en stock</small>
          </div>

          <button
            type="button"
            class="remove-button"
            @click="removeFromCart(item.id_producto)"
          >
            Quitar
          </button>
        </article>
      </section>

      <aside class="summary-panel">
        <div class="summary-box">
          <h2>Resumen</h2>

          <div class="summary-line">
            <span>Subtotal</span>
            <strong>{{ formatoMoneda(subtotal) }}</strong>
          </div>
          <div class="summary-line">
            <span>IVA 12%</span>
            <strong>{{ formatoMoneda(iva) }}</strong>
          </div>
          <div class="summary-line muted">
            <span>Envio</span>
            <strong>Por confirmar</strong>
          </div>

          <div class="divider"></div>

          <div class="summary-line total">
            <span>Total estimado</span>
            <strong>{{ formatoMoneda(total) }}</strong>
          </div>

          <RouterLink to="/pago" class="checkout-button">Proceder al pago</RouterLink>
          <button type="button" class="clear-button" @click="clearCart">
            Vaciar carrito
          </button>

          <p class="notice">Puedes comprar como invitado. Tus datos se solicitan en el siguiente paso.</p>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { useCart } from '../stores/cart';

const {
  items,
  totalItems,
  subtotal,
  iva,
  total,
  incrementQuantity,
  decrementQuantity,
  updateQuantity,
  removeFromCart,
  clearCart
} = useCart();

const formatoMoneda = (valor) => new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2
}).format(Number(valor || 0));

const iniciales = (nombre) => nombre
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((parte) => parte[0])
  .join('')
  .toUpperCase();

const actualizarCantidad = (idProducto, value) => {
  updateQuantity(idProducto, Number(value));
};

</script>

<style scoped>
.cart-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.cart-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--line);
}

.eyebrow {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.cart-header h1 {
  margin: 6px 0 8px;
  color: var(--ink);
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 1;
}

.cart-header p {
  margin: 0;
  color: var(--muted);
}

.continue-link,
.empty-state a {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 42px;
  border-radius: 6px;
  background: var(--ink);
  color: white;
  padding: 0 16px;
  text-decoration: none;
  font-weight: 800;
}

.checkout-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 380px);
  gap: 24px;
  align-items: start;
}

.cart-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.cart-item,
.summary-box,
.empty-state {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
}

.cart-item {
  display: grid;
  grid-template-columns: 88px minmax(180px, 1fr) 146px 150px 72px;
  gap: 16px;
  align-items: center;
  padding: 16px;
}

.item-thumb {
  display: grid;
  place-items: center;
  overflow: hidden;
  width: 88px;
  height: 88px;
  border-radius: 8px;
  background: #eef3f7;
  padding: 8px;
}

.item-thumb img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  object-position: center;
}

.thumb-fallback {
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: white;
  color: var(--ink);
  font-weight: 900;
}

.item-info {
  min-width: 0;
}

.item-info span,
.item-total span,
.item-total small {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 800;
}

.item-info h2 {
  margin: 5px 0 8px;
  color: var(--ink);
  font-size: 1.02rem;
  line-height: 1.35;
}

.item-info code {
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 800;
}

.qty-control {
  display: grid;
  grid-template-columns: 36px 1fr 36px;
  gap: 6px;
  align-items: center;
}

.icon-button,
.remove-button,
.checkout-button,
.clear-button {
  border: 0;
  border-radius: 6px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.icon-button {
  height: 36px;
  background: #eef3f7;
  color: var(--ink);
}

.icon-button:disabled {
  color: #9aa5af;
  cursor: not-allowed;
}

.qty-control input {
  width: 100%;
  height: 36px;
  border: 1px solid var(--line);
  border-radius: 6px;
  text-align: center;
  font: inherit;
  font-weight: 800;
}

.item-total {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-align: right;
}

.item-total strong {
  color: var(--ink);
  font-size: 1.05rem;
}

.remove-button {
  height: 36px;
  background: transparent;
  color: #8c1d18;
}

.summary-panel {
  position: sticky;
  top: 86px;
}

.summary-box,
.empty-state {
  padding: 24px;
}

.summary-box h2,
.empty-state strong {
  display: block;
  margin: 0 0 18px;
  color: var(--ink);
  font-size: 1.35rem;
}

.summary-line {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 14px;
  color: var(--muted);
}

.summary-line strong {
  color: var(--ink);
}

.summary-line.total {
  align-items: baseline;
  color: var(--ink);
  font-size: 1.08rem;
  font-weight: 900;
}

.summary-line.total strong {
  font-size: 1.45rem;
}

.divider {
  height: 1px;
  margin: 20px 0;
  background: var(--line);
}

.checkout-button,
.clear-button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 46px;
  margin-top: 12px;
  text-decoration: none;
}

.checkout-button {
  background: var(--ink);
  color: white;
}

.checkout-button:disabled {
  background: #c9d0d6;
  color: #59636d;
  cursor: not-allowed;
}

.clear-button {
  background: #eef3f7;
  color: var(--ink);
}

.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 14px;
}

.field span {
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.field input,
.field select {
  width: 100%;
  height: 42px;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 0 12px;
  background: white;
  color: var(--ink);
  font: inherit;
}

.notice,
.empty-state p {
  color: var(--muted);
  line-height: 1.55;
}

.notice {
  margin: 16px 0 0;
}

@media (max-width: 980px) {
  .checkout-grid,
  .cart-item {
    grid-template-columns: 1fr;
  }

  .cart-header {
    align-items: stretch;
    flex-direction: column;
  }

  .summary-panel {
    position: static;
  }

  .item-total {
    text-align: left;
  }
}
</style>
