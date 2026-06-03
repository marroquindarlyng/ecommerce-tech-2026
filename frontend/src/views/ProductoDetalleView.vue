<template>
  <section class="detail-page">
    <RouterLink to="/catalogo" class="back-link">Volver al catalogo</RouterLink>

    <div v-if="cargando" class="detail-shell loading-shell">
      <div class="loading-visual"></div>
      <div class="loading-content">
        <div class="loading-line title"></div>
        <div class="loading-line"></div>
        <div class="loading-line short"></div>
      </div>
    </div>

    <div v-else-if="error" class="feedback-panel error-panel">
      <strong>No se pudo cargar el producto</strong>
      <p>{{ error }}</p>
      <button type="button" @click="cargarProducto">Reintentar</button>
    </div>

    <article v-else class="detail-shell">
      <section class="media-panel">
        <img
          v-if="producto.imagen"
          :src="producto.imagen"
          :alt="producto.nombre"
        >
        <div v-else class="visual-fallback">
          <span>{{ iniciales(producto.nombre) }}</span>
          <small>{{ producto.categoria || 'Tecnologia' }}</small>
        </div>
      </section>

      <section class="info-panel">
        <div class="product-heading">
          <span class="category">{{ producto.categoria || 'Sin categoria' }}</span>
          <h1>{{ producto.nombre }}</h1>
          <code>{{ producto.codigo_sku || 'SKU pendiente' }}</code>
        </div>

        <div class="purchase-panel">
          <div>
            <span class="label">Precio unitario</span>
            <strong class="price">{{ formatoMoneda(producto.precio) }}</strong>
          </div>

          <div class="stock-card" :class="stockClase(producto.stock)">
            <span class="label">Stock actual</span>
            <strong>{{ producto.stock }}</strong>
            <small>{{ stockTexto(producto.stock) }}</small>
          </div>
        </div>

        <section class="spec-section">
          <h2>Ficha tecnica</h2>
          <p>{{ producto.ficha_tecnica || 'Este producto aun no tiene ficha tecnica registrada.' }}</p>
        </section>

        <dl class="data-grid">
          <div>
            <dt>ID producto</dt>
            <dd>{{ producto.id_producto }}</dd>
          </div>
          <div>
            <dt>ID categoria</dt>
            <dd>{{ producto.id_categoria || 'N/D' }}</dd>
          </div>
          <div>
            <dt>Disponibilidad</dt>
            <dd>{{ stockTexto(producto.stock) }}</dd>
          </div>
        </dl>
      </section>
    </article>
  </section>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';

const route = useRoute();
const producto = ref(null);
const cargando = ref(true);
const error = ref('');

const obtenerCampo = (objeto, ...campos) => {
  for (const campo of campos) {
    if (objeto[campo] !== undefined && objeto[campo] !== null) {
      return objeto[campo];
    }
  }

  return null;
};

const normalizarProducto = (item) => ({
  id_producto: obtenerCampo(item, 'id_producto', 'ID_PRODUCTO'),
  id_categoria: obtenerCampo(item, 'id_categoria', 'ID_CATEGORIA'),
  codigo_sku: obtenerCampo(item, 'codigo_sku', 'CODIGO_SKU'),
  nombre: obtenerCampo(item, 'nombre', 'NOMBRE') || 'Producto sin nombre',
  precio: Number(obtenerCampo(item, 'precio', 'PRECIO', 'PRECIO_UNITARIO') || 0),
  stock: Number(obtenerCampo(item, 'stock', 'STOCK', 'STOCK_ACTUAL') || 0),
  ficha_tecnica: obtenerCampo(item, 'ficha_tecnica', 'FICHA_TECNICA'),
  imagen: obtenerCampo(item, 'imagen', 'IMAGEN', 'URL_GALERIA'),
  categoria: obtenerCampo(item, 'categoria', 'CATEGORIA')
});

const cargarProducto = async () => {
  cargando.value = true;
  error.value = '';

  try {
    const res = await api.get(`/productos/${route.params.id}`);
    producto.value = normalizarProducto(res.data);
  } catch (err) {
    error.value = err.response?.status === 404
      ? 'El producto solicitado no existe.'
      : 'Verifica que el backend este ejecutandose en http://localhost:3000.';
    console.error(err);
  } finally {
    cargando.value = false;
  }
};

const formatoMoneda = (valor) => new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2
}).format(valor);

const iniciales = (nombre) => nombre
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((parte) => parte[0])
  .join('')
  .toUpperCase();

const stockTexto = (stock) => {
  if (stock === 0) return 'Sin stock disponible';
  if (stock <= 5) return 'Stock limitado';
  return 'Disponible para venta';
};

const stockClase = (stock) => {
  if (stock === 0) return 'out';
  if (stock <= 5) return 'low';
  return 'ok';
};

onMounted(cargarProducto);
watch(() => route.params.id, cargarProducto);
</script>

<style scoped>
.detail-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.back-link {
  width: fit-content;
  color: var(--accent);
  font-weight: 800;
  text-decoration: none;
}

.back-link:hover {
  color: var(--accent-strong);
}

.detail-shell {
  display: grid;
  grid-template-columns: minmax(280px, 0.9fr) minmax(320px, 1.1fr);
  gap: 24px;
  align-items: stretch;
}

.media-panel,
.info-panel,
.feedback-panel {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
}

.media-panel {
  overflow: hidden;
  min-height: 420px;
}

.media-panel img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.visual-fallback {
  display: grid;
  place-items: center;
  gap: 12px;
  width: 100%;
  height: 100%;
  min-height: 420px;
  text-align: center;
  background:
    linear-gradient(135deg, rgba(31, 105, 161, 0.16), rgba(46, 125, 50, 0.1)),
    repeating-linear-gradient(90deg, rgba(18, 52, 77, 0.06) 0 1px, transparent 1px 22px);
}

.visual-fallback span {
  display: grid;
  place-items: center;
  width: 112px;
  height: 112px;
  border: 1px solid rgba(18, 52, 77, 0.16);
  background: rgba(255, 255, 255, 0.76);
  border-radius: 50%;
  color: var(--ink);
  font-size: 2rem;
  font-weight: 900;
}

.visual-fallback small,
.label,
dt {
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.info-panel {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: clamp(22px, 4vw, 36px);
}

.product-heading {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 22px;
  border-bottom: 1px solid var(--line);
}

.category {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  color: var(--ink);
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 1.04;
}

code {
  width: fit-content;
  border: 1px solid rgba(31, 105, 161, 0.22);
  background: #eef5fb;
  border-radius: 999px;
  color: var(--accent-strong);
  padding: 6px 10px;
  font-size: 0.78rem;
  font-weight: 800;
}

.purchase-panel {
  display: grid;
  grid-template-columns: 1fr 180px;
  gap: 16px;
}

.purchase-panel > div {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 18px;
  background: #f9fbfc;
}

.price {
  display: block;
  margin-top: 8px;
  color: var(--ink);
  font-size: 2rem;
}

.stock-card strong {
  display: block;
  margin-top: 8px;
  color: var(--ink);
  font-size: 2rem;
}

.stock-card small {
  color: var(--muted);
  font-weight: 800;
}

.stock-card.ok {
  border-color: rgba(46, 125, 50, 0.28);
}

.stock-card.low {
  border-color: rgba(182, 93, 19, 0.32);
}

.stock-card.out {
  border-color: rgba(140, 29, 24, 0.32);
}

.spec-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.spec-section h2 {
  color: var(--ink);
  font-size: 1.2rem;
}

.spec-section p {
  color: var(--muted);
  line-height: 1.65;
  white-space: pre-line;
}

.data-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin: 0;
}

.data-grid div {
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 14px;
}

.data-grid dd {
  margin: 7px 0 0;
  color: var(--ink);
  font-weight: 900;
}

.feedback-panel {
  padding: 28px;
  color: var(--muted);
}

.feedback-panel strong {
  display: block;
  margin-bottom: 6px;
  color: var(--ink);
  font-size: 1.1rem;
}

.feedback-panel p {
  margin-bottom: 16px;
}

button {
  min-width: 110px;
  height: 42px;
  border: 0;
  border-radius: 6px;
  background: var(--ink);
  color: white;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

.loading-visual,
.loading-line {
  border-radius: 8px;
  background: linear-gradient(90deg, #edf1f4, #f8fafb, #edf1f4);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite linear;
}

.loading-visual {
  min-height: 420px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: clamp(22px, 4vw, 36px);
}

.loading-line {
  height: 18px;
}

.loading-line.title {
  height: 56px;
  width: 80%;
}

.loading-line.short {
  width: 42%;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@media (max-width: 860px) {
  .detail-shell,
  .purchase-panel,
  .data-grid {
    grid-template-columns: 1fr;
  }

  .media-panel,
  .visual-fallback,
  .loading-visual {
    min-height: 300px;
  }
}
</style>
