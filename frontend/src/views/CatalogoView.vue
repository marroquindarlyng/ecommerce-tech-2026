<template>
  <section class="catalog-page">
    <header class="catalog-header">
      <div>
        <span class="eyebrow">Catalogo</span>
        <h1>Articulos disponibles</h1>
        <p>Elige tu siguiente upgrade con stock actualizado y compra rapida.</p>
      </div>

      <div class="catalog-summary" aria-label="Resumen del catalogo">
        <strong>{{ productosFiltrados.length }}</strong>
        <span>{{ productosFiltrados.length === 1 ? 'producto' : 'productos' }}</span>
      </div>
    </header>

    <section class="toolbar" aria-label="Filtros del catalogo">
      <label class="search-box">
        <span>Buscar</span>
        <input
          v-model.trim="busqueda"
          type="search"
          placeholder="Nombre, SKU o categoria"
          autocomplete="off"
        >
      </label>

      <label class="filter-box">
        <span>Categoria</span>
        <select v-model="categoriaSeleccionada">
          <option value="">Todas</option>
          <option
            v-for="categoria in categorias"
            :key="categoria.id_categoria"
            :value="categoria.nombre"
          >
            {{ categoria.nombre }}
          </option>
        </select>
      </label>

      <label class="filter-box sort-box">
        <span>Ordenar</span>
        <select v-model="ordenSeleccionado">
          <option value="nombre">Nombre A-Z</option>
          <option value="precio-asc">Menor precio</option>
          <option value="precio-desc">Mayor precio</option>
          <option value="stock-desc">Mayor stock</option>
        </select>
      </label>
    </section>

    <section class="catalog-highlights" aria-label="Beneficios del catalogo">
      <article>
        <span>Nuevo</span>
        <strong>Arma tu setup</strong>
        <small>Encuentra laptops, monitores, componentes y accesorios en un solo lugar.</small>
      </article>
      <article>
        <span>Stock</span>
        <strong>{{ stockDisponible }} unidades</strong>
        <small>Disponibilidad visible antes de agregar al carrito.</small>
      </article>
      <article>
        <span>Compra</span>
        <strong>Checkout rapido</strong>
        <small>Guarda tu carrito y completa tu pedido en pocos pasos.</small>
      </article>
    </section>

    <div v-if="cargando" class="state-grid" aria-live="polite">
      <article v-for="item in 6" :key="item" class="skeleton-card">
        <div class="skeleton-visual"></div>
        <div class="skeleton-line wide"></div>
        <div class="skeleton-line"></div>
        <div class="skeleton-line short"></div>
      </article>
    </div>

    <div v-else-if="error" class="feedback-panel error-panel">
      <strong>No se pudo cargar el catalogo</strong>
      <p>{{ error }}</p>
      <button type="button" @click="cargarCatalogo">Reintentar</button>
    </div>

    <div v-else-if="productosFiltrados.length === 0" class="feedback-panel">
      <strong>Sin resultados</strong>
      <p>Prueba con otra busqueda o cambia la categoria seleccionada.</p>
    </div>

    <div v-else class="product-grid">
      <article
        v-for="producto in productosFiltrados"
        :key="producto.id_producto"
        class="product-card"
      >
        <RouterLink
          :to="{ name: 'ProductoDetalle', params: { id: producto.id_producto } }"
          class="product-link"
          :aria-label="`Ver detalle de ${producto.nombre}`"
        >
          <div class="product-visual">
            <img
              v-if="producto.imagen"
              :src="producto.imagen"
              :alt="producto.nombre"
              loading="lazy"
            >
            <div v-else class="visual-fallback">
              <span>{{ iniciales(producto.nombre) }}</span>
              <small>{{ producto.categoria || 'Tecnologia' }}</small>
            </div>

            <span class="stock-badge" :class="stockClase(producto.stock)">
              {{ stockTexto(producto.stock) }}
            </span>
          </div>

          <div class="product-info">
            <div class="product-meta">
              <span>{{ producto.categoria || 'Sin categoria' }}</span>
              <code>{{ producto.codigo_sku || 'SKU no disponible' }}</code>
            </div>

            <h2>{{ producto.nombre }}</h2>

            <p class="description">
              {{ producto.ficha_tecnica || 'Informacion tecnica en actualizacion.' }}
            </p>
          </div>
        </RouterLink>

        <div class="product-footer">
          <div>
            <span class="price-label">Precio</span>
            <strong class="price">{{ formatoMoneda(producto.precio) }}</strong>
          </div>

          <button
            type="button"
            class="cart-action"
            :disabled="producto.stock === 0"
            @click="agregarProducto(producto)"
          >
            {{ producto.stock === 0 ? 'Agotado' : 'Agregar' }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import api from '../services/api';
import { resolveAssetUrl } from '../services/assets';
import { useCart } from '../stores/cart';

const route = useRoute();
const productos = ref([]);
const categorias = ref([]);
const busqueda = ref('');
const categoriaSeleccionada = ref('');
const ordenSeleccionado = ref('nombre');
const cargando = ref(true);
const error = ref('');
const { addToCart } = useCart();

const obtenerCampo = (objeto, ...campos) => {
  for (const campo of campos) {
    if (objeto[campo] !== undefined && objeto[campo] !== null) {
      return objeto[campo];
    }
  }

  return null;
};

const normalizarProducto = (producto) => ({
  id_producto: obtenerCampo(producto, 'id_producto', 'ID_PRODUCTO'),
  id_categoria: obtenerCampo(producto, 'id_categoria', 'ID_CATEGORIA'),
  codigo_sku: obtenerCampo(producto, 'codigo_sku', 'CODIGO_SKU'),
  nombre: obtenerCampo(producto, 'nombre', 'NOMBRE') || 'Producto sin nombre',
  precio: Number(obtenerCampo(producto, 'precio', 'PRECIO', 'PRECIO_UNITARIO') || 0),
  stock: Number(obtenerCampo(producto, 'stock', 'STOCK', 'STOCK_ACTUAL') || 0),
  ficha_tecnica: obtenerCampo(producto, 'ficha_tecnica', 'FICHA_TECNICA'),
  imagen: resolveAssetUrl(obtenerCampo(producto, 'imagen', 'IMAGEN', 'URL_GALERIA')),
  categoria: obtenerCampo(producto, 'categoria', 'CATEGORIA')
});

const normalizarCategoria = (categoria) => ({
  id_categoria: obtenerCampo(categoria, 'id_categoria', 'ID_CATEGORIA'),
  nombre: obtenerCampo(categoria, 'nombre', 'NOMBRE') || 'Sin categoria'
});

const cargarCatalogo = async () => {
  cargando.value = true;
  error.value = '';

  try {
    const [productosRes, categoriasRes] = await Promise.all([
      api.get('/productos'),
      api.get('/categorias')
    ]);

    productos.value = productosRes.data.map(normalizarProducto);
    categorias.value = categoriasRes.data.map(normalizarCategoria);
  } catch (err) {
    error.value = 'El catalogo no esta disponible en este momento. Intenta nuevamente en unos segundos.';
    console.error(err);
  } finally {
    cargando.value = false;
  }
};

const productosFiltrados = computed(() => {
  const texto = busqueda.value.toLowerCase();

  const filtrados = productos.value.filter((producto) => {
    const coincideCategoria = !categoriaSeleccionada.value || producto.categoria === categoriaSeleccionada.value;
    const contenido = [
      producto.nombre,
      producto.codigo_sku,
      producto.categoria
    ].filter(Boolean).join(' ').toLowerCase();

    return coincideCategoria && (!texto || contenido.includes(texto));
  });

  return [...filtrados].sort((a, b) => {
    if (ordenSeleccionado.value === 'precio-asc') return a.precio - b.precio;
    if (ordenSeleccionado.value === 'precio-desc') return b.precio - a.precio;
    if (ordenSeleccionado.value === 'stock-desc') return b.stock - a.stock;
    return a.nombre.localeCompare(b.nombre);
  });
});

const stockDisponible = computed(() => productos.value.reduce((total, producto) => total + producto.stock, 0));

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
  if (stock === 0) return 'Sin stock';
  if (stock <= 5) return `${stock} disponibles`;
  return 'Disponible';
};

const stockClase = (stock) => {
  if (stock === 0) return 'out';
  if (stock <= 5) return 'low';
  return 'ok';
};

const agregarProducto = (producto) => {
  addToCart(producto, 1);
};

const sincronizarQuery = () => {
  busqueda.value = typeof route.query.buscar === 'string' ? route.query.buscar : '';
  categoriaSeleccionada.value = typeof route.query.categoria === 'string' ? route.query.categoria : '';
};

onMounted(() => {
  sincronizarQuery();
  cargarCatalogo();
});
watch(() => route.query, sincronizarQuery);
</script>

<style scoped>
.catalog-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.catalog-header {
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

.catalog-header h1 {
  margin: 6px 0 8px;
  color: var(--ink);
  font-size: clamp(2rem, 5vw, 3.4rem);
  line-height: 1;
}

.catalog-header p {
  margin: 0;
  color: var(--muted);
  font-size: 1rem;
}

.catalog-summary {
  min-width: 132px;
  padding: 16px;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  text-align: right;
  box-shadow: var(--shadow-soft);
}

.catalog-summary strong {
  display: block;
  color: var(--ink);
  font-size: 2rem;
  line-height: 1;
}

.catalog-summary span {
  color: var(--muted);
  font-size: 0.85rem;
}

.toolbar {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) minmax(180px, 240px) minmax(160px, 220px);
  gap: 14px;
  align-items: end;
}

.search-box,
.filter-box {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.search-box span,
.filter-box span {
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

input,
select {
  width: 100%;
  height: 46px;
  box-sizing: border-box;
  border: 1px solid var(--line);
  background: var(--surface);
  color: var(--ink);
  border-radius: 6px;
  padding: 0 14px;
  font: inherit;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

input:focus,
select:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(31, 105, 161, 0.14);
}

.catalog-highlights {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 14px;
}

.catalog-highlights article {
  display: grid;
  gap: 7px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(31, 105, 161, 0.08), rgba(182, 93, 19, 0.05)),
    white;
  padding: 18px;
  box-shadow: var(--shadow-soft);
}

.catalog-highlights span {
  color: var(--accent);
  font-size: 0.74rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.catalog-highlights strong {
  color: var(--ink);
  font-size: 1.1rem;
}

.catalog-highlights small {
  color: var(--muted);
  line-height: 1.5;
}

.product-grid,
.state-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  align-items: stretch;
  gap: 18px;
}

.product-card,
.skeleton-card {
  overflow: hidden;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
}

.product-card {
  display: flex;
  flex-direction: column;
  min-height: 520px;
  color: inherit;
  text-decoration: none;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.product-card:hover {
  transform: translateY(-3px);
  border-color: rgba(31, 105, 161, 0.34);
  box-shadow: 0 18px 36px rgba(24, 39, 75, 0.1);
}

.product-link {
  display: grid;
  grid-template-rows: 230px 1fr;
  flex: 1;
  color: inherit;
  text-decoration: none;
}

.product-visual {
  position: relative;
  display: grid;
  place-items: center;
  height: 230px;
  background:
    radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.9), transparent 32%),
    linear-gradient(145deg, #edf3f8, #f9fbfc);
  padding: 18px;
}

.product-visual img {
  width: auto;
  height: auto;
  max-width: min(86%, 190px);
  max-height: 152px;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 10px 18px rgba(24, 39, 75, 0.12));
}

.visual-fallback {
  display: grid;
  place-items: center;
  gap: 8px;
  width: 100%;
  height: 100%;
  color: #12344d;
  text-align: center;
  background:
    linear-gradient(135deg, rgba(31, 105, 161, 0.12), rgba(46, 125, 50, 0.1)),
    repeating-linear-gradient(90deg, rgba(18, 52, 77, 0.06) 0 1px, transparent 1px 18px);
}

.visual-fallback span {
  display: grid;
  place-items: center;
  width: 76px;
  height: 76px;
  border: 1px solid rgba(18, 52, 77, 0.16);
  background: rgba(255, 255, 255, 0.72);
  border-radius: 50%;
  color: var(--ink);
  font-size: 1.35rem;
  font-weight: 900;
}

.visual-fallback small {
  max-width: 80%;
  color: var(--muted);
  font-size: 0.8rem;
  font-weight: 700;
}

.stock-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 6px 10px;
  border-radius: 999px;
  color: white;
  font-size: 0.74rem;
  font-weight: 800;
}

.stock-badge.ok {
  background: #2e7d32;
}

.stock-badge.low {
  background: #b65d13;
}

.stock-badge.out {
  background: #8c1d18;
}

.product-info {
  display: grid;
  grid-template-rows: auto minmax(2.9em, auto) minmax(4.5em, auto);
  gap: 14px;
  padding: 18px;
  background: linear-gradient(180deg, #fff, #fbfdff);
}

.product-meta {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.product-meta span {
  overflow: hidden;
  max-width: 50%;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-meta code {
  overflow: hidden;
  max-width: 48%;
  color: var(--accent);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.product-info h2 {
  display: -webkit-box;
  min-height: 2.9em;
  margin: 0;
  overflow: hidden;
  color: var(--ink);
  font-size: 1.08rem;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.description {
  display: -webkit-box;
  min-height: 4.5em;
  margin: 0;
  overflow: hidden;
  color: var(--muted);
  font-size: 0.92rem;
  line-height: 1.5;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-top: auto;
  padding: 0 18px 18px;
}

.price-label {
  display: block;
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 800;
}

.price {
  color: var(--ink);
  font-size: 1.24rem;
}

.cart-action,
button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-width: 94px;
  height: 42px;
  border: 0;
  border-radius: 6px;
  background: var(--ink);
  color: white;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: background 0.2s ease, transform 0.2s ease;
}

.product-card:hover .cart-action,
button:hover:not(:disabled) {
  background: var(--accent);
  transform: translateY(-1px);
}

button:disabled {
  background: #c9d0d6;
  color: #59636d;
  cursor: not-allowed;
}

.feedback-panel {
  padding: 28px;
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  color: var(--muted);
  box-shadow: var(--shadow-soft);
}

.feedback-panel strong {
  display: block;
  margin-bottom: 6px;
  color: var(--ink);
  font-size: 1.1rem;
}

.feedback-panel p {
  margin: 0 0 16px;
}

.error-panel {
  border-color: rgba(140, 29, 24, 0.22);
}

.skeleton-card {
  padding: 14px;
}

.skeleton-visual,
.skeleton-line {
  border-radius: 6px;
  background: linear-gradient(90deg, #edf1f4, #f8fafb, #edf1f4);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite linear;
}

.skeleton-visual {
  aspect-ratio: 4 / 3;
  margin-bottom: 16px;
}

.skeleton-line {
  height: 14px;
  margin-bottom: 10px;
}

.skeleton-line.wide {
  width: 86%;
}

.skeleton-line.short {
  width: 44%;
}

@keyframes shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}

@media (max-width: 760px) {
  .catalog-header,
  .product-footer {
    align-items: stretch;
    flex-direction: column;
  }

  .catalog-summary {
    width: auto;
    text-align: left;
  }

  .toolbar {
    grid-template-columns: 1fr;
  }

  .catalog-highlights {
    grid-template-columns: 1fr;
  }

  .product-grid,
  .state-grid {
    grid-template-columns: 1fr;
  }

  .product-card {
    min-height: auto;
  }

  .product-info h2,
  .description {
    min-height: auto;
  }

  button {
    width: 100%;
  }
}
</style>
