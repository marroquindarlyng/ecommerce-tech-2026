<template>
  <section class="home-page">
    <section class="hero-carousel" aria-label="Promociones principales">
      <article class="hero-slide">
        <div class="hero-copy">
          <span class="eyebrow">{{ slideActual.etiqueta }}</span>
          <h1>{{ slideActual.titulo }}</h1>
          <p>{{ slideActual.descripcion }}</p>

          <form class="hero-search" @submit.prevent="buscar">
            <input
              v-model.trim="busqueda"
              type="search"
              placeholder="Buscar laptop, mouse, monitor, SSD..."
              autocomplete="off"
            >
            <button type="submit">Buscar</button>
          </form>

          <div class="hero-actions">
            <RouterLink :to="slideActual.to">Explorar ahora</RouterLink>
            <RouterLink to="/catalogo" class="secondary-action">Ver catalogo</RouterLink>
          </div>
        </div>

        <div class="hero-product">
          <div class="hero-image">
            <img v-if="slideActual.imagen" :src="slideActual.imagen" :alt="slideActual.titulo">
            <span v-else>{{ iniciales(slideActual.titulo) }}</span>
          </div>
          <div class="hero-price">
            <small>{{ slideActual.categoria }}</small>
            <strong>{{ slideActual.precio }}</strong>
          </div>
        </div>

        <div class="carousel-controls" aria-label="Controles del carrusel">
          <button type="button" aria-label="Anterior" @click="slideAnterior">&lsaquo;</button>
          <div>
            <button
              v-for="(_, index) in slides"
              :key="index"
              type="button"
              :class="{ active: index === slideIndex }"
              :aria-label="`Ir a promocion ${index + 1}`"
              @click="slideIndex = index"
            ></button>
          </div>
          <button type="button" aria-label="Siguiente" @click="slideSiguiente">&rsaquo;</button>
        </div>
      </article>

      <aside class="deal-panel">
        <span class="panel-label">Compra inteligente</span>
        <strong>{{ resumen.productos }}</strong>
        <p>productos disponibles para armar, renovar o potenciar tu setup.</p>
        <div class="mini-stats">
          <div>
            <span>{{ resumen.categorias }}</span>
            <small>categorias</small>
          </div>
          <div>
            <span>{{ resumen.stock }}</span>
            <small>unidades</small>
          </div>
        </div>
      </aside>
    </section>

    <section class="offer-strip" aria-label="Ofertas destacadas">
      <article v-for="oferta in ofertasRapidas" :key="oferta.titulo">
        <span>{{ oferta.tag }}</span>
        <strong>{{ oferta.titulo }}</strong>
        <small>{{ oferta.detalle }}</small>
      </article>
    </section>

    <section class="service-strip" aria-label="Beneficios de compra">
      <article v-for="item in beneficios" :key="item.titulo">
        <span>{{ item.icono }}</span>
        <div>
          <strong>{{ item.titulo }}</strong>
          <p>{{ item.descripcion }}</p>
        </div>
      </article>
    </section>

    <section class="products-section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Ofertas</span>
          <h2>Precios destacados</h2>
        </div>
        <RouterLink to="/catalogo">Ver todos</RouterLink>
      </div>

      <div class="deal-grid">
        <article v-for="producto in productosOferta" :key="producto.id_producto" class="deal-card">
          <RouterLink :to="{ name: 'ProductoDetalle', params: { id: producto.id_producto } }" class="deal-link">
            <div class="deal-visual">
              <img v-if="producto.imagen" :src="producto.imagen" :alt="producto.nombre">
              <span v-else>{{ iniciales(producto.nombre) }}</span>
            </div>
            <div>
              <small>{{ producto.categoria || 'Tecnologia' }}</small>
              <h3>{{ producto.nombre }}</h3>
              <strong>{{ formatoMoneda(producto.precio) }}</strong>
            </div>
          </RouterLink>
          <button type="button" :disabled="producto.stock === 0" @click="addToCart(producto, 1)">
            {{ producto.stock === 0 ? 'Agotado' : 'Agregar' }}
          </button>
        </article>
      </div>
    </section>

    <section class="category-section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Categorias</span>
          <h2>Compra por tipo de producto</h2>
        </div>
        <RouterLink to="/catalogo">Todas</RouterLink>
      </div>

      <div v-if="cargando" class="category-grid">
        <div v-for="item in 6" :key="item" class="category-skeleton"></div>
      </div>
      <div v-else class="category-grid">
        <RouterLink
          v-for="categoria in categoriasConConteo"
          :key="categoria.id_categoria"
          :to="{ name: 'Catalogo', query: { categoria: categoria.nombre } }"
          class="category-card"
        >
          <span>{{ iniciales(categoria.nombre) }}</span>
          <strong>{{ categoria.nombre }}</strong>
          <small>{{ categoria.total }} productos</small>
        </RouterLink>
      </div>
    </section>

    <section class="promo-grid">
      <article class="promo-card main-promo">
        <span>Setup completo</span>
        <h2>De componentes a accesorios, todo en un mismo carrito.</h2>
        <p>Filtra, compara y agrega productos sin perder el ritmo de compra.</p>
        <RouterLink to="/catalogo">Explorar inventario</RouterLink>
      </article>

      <article class="promo-card">
        <span>Soporte local</span>
        <h3>Acompanamiento antes de comprar</h3>
        <p>Resuelve dudas sobre compatibilidad, stock o entrega.</p>
      </article>

      <article class="promo-card">
        <span>Pago</span>
        <h3>VisaCuotas</h3>
        <p>Elige cuotas y completa tu pedido en pocos pasos.</p>
      </article>
    </section>

    <section class="products-section">
      <div class="section-heading">
        <div>
          <span class="eyebrow">Destacados</span>
          <h2>Productos recomendados</h2>
        </div>
        <RouterLink to="/catalogo">Ver todos</RouterLink>
      </div>

      <div v-if="error" class="feedback-panel">
        <strong>No se pudo cargar la tienda</strong>
        <p>{{ error }}</p>
        <button type="button" @click="cargarHome">Reintentar</button>
      </div>

      <div v-else class="featured-grid">
        <article v-for="producto in productosDestacados" :key="producto.id_producto" class="featured-card">
          <RouterLink :to="{ name: 'ProductoDetalle', params: { id: producto.id_producto } }" class="featured-link">
            <div class="product-visual">
              <img v-if="producto.imagen" :src="producto.imagen" :alt="producto.nombre">
              <div v-else class="visual-fallback">
                <span>{{ iniciales(producto.nombre) }}</span>
              </div>
            </div>
            <div class="featured-info">
              <small>{{ producto.categoria || 'Tecnologia' }}</small>
              <h3>{{ producto.nombre }}</h3>
              <strong>{{ formatoMoneda(producto.precio) }}</strong>
            </div>
          </RouterLink>
          <button type="button" :disabled="producto.stock === 0" @click="addToCart(producto, 1)">
            {{ producto.stock === 0 ? 'Agotado' : 'Agregar' }}
          </button>
        </article>
      </div>
    </section>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import { resolveAssetUrl } from '../services/assets';
import { useCart } from '../stores/cart';

const router = useRouter();
const { addToCart } = useCart();
const productos = ref([]);
const categorias = ref([]);
const busqueda = ref('');
const cargando = ref(true);
const error = ref('');
const slideIndex = ref(0);
let carouselTimer = null;

const beneficios = [
  { icono: 'GT', titulo: 'Compra local', descripcion: 'Precios en quetzales y flujo pensado para Guatemala.' },
  { icono: '12%', titulo: 'Total claro', descripcion: 'Impuestos visibles antes de pagar.' },
  { icono: 'ST', titulo: 'Stock visible', descripcion: 'Disponibilidad actualizada para decidir rapido.' },
  { icono: 'VC', titulo: 'VisaCuotas', descripcion: 'Seleccion de cuotas desde el checkout.' }
];

const ofertasRapidas = [
  { tag: 'Gaming', titulo: 'Accesorios listos', detalle: 'Mouse, teclados y audio para jugar mejor.' },
  { tag: 'Trabajo', titulo: 'Laptops potentes', detalle: 'Equipos para estudio, oficina y creacion.' },
  { tag: 'Upgrade', titulo: 'Componentes PC', detalle: 'Procesadores, RAM, SSD y motherboards.' }
];

const obtenerCampo = (objeto, ...campos) => {
  for (const campo of campos) {
    if (objeto[campo] !== undefined && objeto[campo] !== null) return objeto[campo];
  }
  return null;
};

const normalizarProducto = (producto) => ({
  id_producto: obtenerCampo(producto, 'id_producto', 'ID_PRODUCTO'),
  id_categoria: obtenerCampo(producto, 'id_categoria', 'ID_CATEGORIA'),
  codigo_sku: obtenerCampo(producto, 'codigo_sku', 'CODIGO_SKU'),
  nombre: obtenerCampo(producto, 'nombre', 'NOMBRE') || 'Producto sin nombre',
  precio: Number(obtenerCampo(producto, 'precio', 'PRECIO', 'precio_unitario', 'PRECIO_UNITARIO') || 0),
  stock: Number(obtenerCampo(producto, 'stock', 'STOCK', 'stock_actual', 'STOCK_ACTUAL') || 0),
  ficha_tecnica: obtenerCampo(producto, 'ficha_tecnica', 'FICHA_TECNICA'),
  imagen: resolveAssetUrl(obtenerCampo(producto, 'imagen', 'IMAGEN', 'url_galeria', 'URL_GALERIA')),
  categoria: obtenerCampo(producto, 'categoria', 'CATEGORIA')
});

const normalizarCategoria = (categoria) => ({
  id_categoria: obtenerCampo(categoria, 'id_categoria', 'ID_CATEGORIA'),
  nombre: obtenerCampo(categoria, 'nombre', 'NOMBRE') || 'Sin categoria'
});

const cargarHome = async () => {
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
    error.value = 'La tienda no esta disponible en este momento. Intenta nuevamente en unos segundos.';
    console.error(err);
  } finally {
    cargando.value = false;
  }
};

const resumen = computed(() => ({
  productos: productos.value.length,
  categorias: categorias.value.length,
  stock: productos.value.reduce((total, producto) => total + producto.stock, 0)
}));

const categoriasConConteo = computed(() => categorias.value.map((categoria) => ({
  ...categoria,
  total: productos.value.filter((producto) => producto.categoria === categoria.nombre).length
})));

const productosDestacados = computed(() => [...productos.value]
  .filter((producto) => producto.stock > 0)
  .sort((a, b) => b.stock - a.stock)
  .slice(0, 8));

const productosOferta = computed(() => [...productos.value]
  .filter((producto) => producto.stock > 0)
  .sort((a, b) => a.precio - b.precio)
  .slice(0, 4));

const slides = computed(() => {
  const top = productosDestacados.value.slice(0, 3);
  if (top.length > 0) {
    return top.map((producto, index) => ({
      etiqueta: index === 0 ? 'Oferta destacada' : 'Seleccion Tech2026',
      titulo: producto.nombre,
      descripcion: producto.ficha_tecnica || 'Producto seleccionado para potenciar tu setup con disponibilidad inmediata.',
      imagen: producto.imagen,
      categoria: producto.categoria || 'Tecnologia',
      precio: formatoMoneda(producto.precio),
      to: { name: 'ProductoDetalle', params: { id: producto.id_producto } }
    }));
  }

  return [
    {
      etiqueta: 'Tienda tech Guatemala',
      titulo: 'Hardware, accesorios y equipo listo para tu siguiente proyecto.',
      descripcion: 'Compra rapido, revisa disponibilidad y arma tu pedido en pocos pasos.',
      imagen: '',
      categoria: 'Catalogo',
      precio: 'Explora productos',
      to: '/catalogo'
    }
  ];
});

const slideActual = computed(() => slides.value[slideIndex.value % slides.value.length]);

const slideSiguiente = () => {
  slideIndex.value = (slideIndex.value + 1) % slides.value.length;
};

const slideAnterior = () => {
  slideIndex.value = (slideIndex.value - 1 + slides.value.length) % slides.value.length;
};

const buscar = () => {
  router.push({ name: 'Catalogo', query: busqueda.value ? { buscar: busqueda.value } : {} });
};

const formatoMoneda = (valor) => new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2
}).format(Number(valor || 0));

const iniciales = (nombre) => String(nombre || '')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((parte) => parte[0])
  .join('')
  .toUpperCase();

onMounted(() => {
  cargarHome();
  carouselTimer = window.setInterval(slideSiguiente, 6500);
});

onBeforeUnmount(() => {
  if (carouselTimer) window.clearInterval(carouselTimer);
});
</script>

<style scoped>
.home-page {
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.hero-carousel {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 360px);
  gap: 24px;
}

.hero-slide,
.deal-panel,
.promo-card,
.featured-card,
.deal-card,
.category-card,
.service-strip article,
.offer-strip article,
.feedback-panel {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
}

.hero-slide {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(260px, 380px);
  gap: 24px;
  overflow: hidden;
  min-height: 430px;
  padding: clamp(28px, 5vw, 56px);
  background:
    linear-gradient(135deg, rgba(23, 33, 43, 0.96), rgba(31, 105, 161, 0.88) 55%, rgba(46, 125, 50, 0.72)),
    var(--ink);
  color: white;
}

.hero-slide::after {
  content: "";
  position: absolute;
  inset: auto -10% -45% 45%;
  height: 320px;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.18), transparent 62%);
  pointer-events: none;
}

.hero-copy {
  position: relative;
  z-index: 1;
  align-self: center;
}

.eyebrow,
.panel-label,
.promo-card span {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-slide .eyebrow {
  color: rgba(255, 255, 255, 0.78);
}

.hero-copy h1 {
  max-width: 760px;
  margin: 10px 0 14px;
  font-size: clamp(2.4rem, 6vw, 4.8rem);
  line-height: 0.96;
}

.hero-copy p {
  max-width: 680px;
  color: rgba(255, 255, 255, 0.78);
  font-size: 1.05rem;
  line-height: 1.55;
}

.hero-search {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 10px;
  max-width: 720px;
  margin-top: 24px;
}

.hero-search input {
  min-width: 0;
  height: 52px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.94);
  padding: 0 16px;
  font: inherit;
}

.hero-search button,
.hero-actions a,
.promo-card a,
.featured-card button,
.deal-card button,
.feedback-panel button {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 44px;
  border: 0;
  border-radius: 6px;
  background: var(--ink);
  color: white;
  padding: 0 16px;
  font: inherit;
  font-weight: 900;
  text-decoration: none;
  cursor: pointer;
}

.hero-search button,
.hero-actions a {
  background: white;
  color: var(--ink);
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.hero-actions .secondary-action {
  background: rgba(255, 255, 255, 0.14);
  color: white;
}

.hero-product {
  position: relative;
  z-index: 1;
  display: grid;
  align-content: center;
  gap: 16px;
}

.hero-image {
  display: grid;
  place-items: center;
  min-height: 280px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.9);
  padding: 26px;
}

.hero-image img {
  width: auto;
  height: auto;
  max-width: 90%;
  max-height: 250px;
  object-fit: contain;
  filter: drop-shadow(0 20px 28px rgba(24, 39, 75, 0.24));
}

.hero-image span {
  color: var(--ink);
  font-size: 2.4rem;
  font-weight: 900;
}

.hero-price {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.12);
  padding: 14px 16px;
}

.hero-price small {
  color: rgba(255, 255, 255, 0.72);
  font-weight: 900;
}

.hero-price strong {
  font-size: 1.25rem;
}

.carousel-controls {
  position: absolute;
  left: clamp(18px, 4vw, 40px);
  right: clamp(18px, 4vw, 40px);
  bottom: 18px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 2;
}

.carousel-controls button {
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  color: white;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.carousel-controls > div {
  display: flex;
  gap: 7px;
}

.carousel-controls > div button {
  width: 9px;
  height: 9px;
  min-height: 0;
  background: rgba(255, 255, 255, 0.36);
}

.carousel-controls > div button.active {
  width: 24px;
  border-radius: 999px;
  background: white;
}

.deal-panel {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 28px;
  background:
    linear-gradient(160deg, #17212b, #12344d 58%, #1f3f2b);
  color: white;
}

.deal-panel .panel-label,
.deal-panel p {
  color: rgba(255, 255, 255, 0.72);
}

.deal-panel strong {
  margin-top: 20px;
  font-size: 4.5rem;
  line-height: 1;
}

.mini-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 28px;
}

.mini-stats div {
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 8px;
  padding: 14px;
}

.mini-stats span {
  display: block;
  color: white;
  font-size: 1.5rem;
  font-weight: 900;
}

.mini-stats small {
  color: rgba(255, 255, 255, 0.68);
}

.offer-strip,
.service-strip,
.category-grid,
.featured-grid,
.promo-grid,
.deal-grid {
  display: grid;
  gap: 14px;
}

.offer-strip {
  grid-template-columns: repeat(3, 1fr);
}

.offer-strip article {
  display: grid;
  gap: 6px;
  padding: 18px;
  background:
    linear-gradient(135deg, rgba(31, 105, 161, 0.08), rgba(182, 93, 19, 0.06)),
    white;
}

.offer-strip span {
  color: var(--warning);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.offer-strip strong,
.service-strip strong {
  color: var(--ink);
}

.offer-strip small,
.service-strip p,
.promo-card p,
.featured-info small,
.deal-link small {
  color: var(--muted);
  line-height: 1.55;
}

.service-strip {
  grid-template-columns: repeat(4, 1fr);
}

.service-strip article {
  display: flex;
  gap: 12px;
  padding: 18px;
}

.service-strip article > span {
  display: grid;
  place-items: center;
  flex: 0 0 42px;
  height: 42px;
  border-radius: 8px;
  background: #eef3f7;
  color: var(--accent-strong);
  font-weight: 900;
}

.service-strip p {
  margin: 4px 0 0;
  font-size: 0.9rem;
}

.section-heading {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: 18px;
  margin-bottom: 16px;
}

.section-heading h2 {
  margin: 6px 0 0;
  color: var(--ink);
  font-size: clamp(1.8rem, 4vw, 2.8rem);
}

.section-heading a {
  color: var(--accent);
  font-weight: 900;
  text-decoration: none;
}

.deal-grid {
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
}

.deal-card {
  display: grid;
  grid-template-rows: 1fr auto;
  overflow: hidden;
}

.deal-link {
  display: grid;
  grid-template-columns: 110px minmax(0, 1fr);
  gap: 14px;
  color: inherit;
  padding: 14px;
  text-decoration: none;
}

.deal-visual {
  display: grid;
  place-items: center;
  height: 110px;
  border-radius: 8px;
  background: #eef3f7;
  padding: 10px;
}

.deal-visual img {
  width: auto;
  height: auto;
  max-width: 90%;
  max-height: 84%;
  object-fit: contain;
}

.deal-visual span {
  color: var(--ink);
  font-weight: 900;
}

.deal-card h3 {
  display: -webkit-box;
  min-height: 2.7em;
  margin: 5px 0 8px;
  overflow: hidden;
  color: var(--ink);
  font-size: 0.98rem;
  line-height: 1.35;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.deal-card strong {
  color: var(--ink);
  font-size: 1.18rem;
}

.deal-card button {
  margin: 0 14px 14px;
}

.category-grid {
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
}

.category-card {
  display: grid;
  gap: 8px;
  padding: 18px;
  color: inherit;
  text-decoration: none;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.category-card:hover,
.featured-card:hover,
.deal-card:hover {
  transform: translateY(-2px);
  border-color: rgba(31, 105, 161, 0.34);
}

.category-card span {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: #eef3f7;
  color: var(--accent-strong);
  font-weight: 900;
}

.category-card strong {
  color: var(--ink);
}

.category-card small {
  color: var(--muted);
}

.category-skeleton {
  height: 126px;
  border-radius: 8px;
  background: linear-gradient(90deg, #edf1f4, #f8fafb, #edf1f4);
  background-size: 200% 100%;
  animation: shimmer 1.2s infinite linear;
}

.promo-grid {
  grid-template-columns: 1.4fr 1fr 1fr;
}

.promo-card {
  padding: 24px;
}

.main-promo {
  background:
    linear-gradient(135deg, rgba(23, 33, 43, 0.95), rgba(31, 105, 161, 0.88)),
    var(--ink);
  color: white;
}

.main-promo span,
.main-promo p {
  color: rgba(255, 255, 255, 0.74);
}

.promo-card h2,
.promo-card h3 {
  margin: 8px 0;
}

.main-promo h2 {
  max-width: 560px;
  font-size: clamp(1.8rem, 4vw, 3rem);
}

.featured-grid {
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  align-items: stretch;
}

.featured-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 450px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.featured-link {
  display: grid;
  grid-template-rows: 226px 1fr;
  flex: 1;
  color: inherit;
  text-decoration: none;
}

.product-visual {
  display: grid;
  place-items: center;
  height: 226px;
  background: #eef3f7;
  padding: 18px;
}

.product-visual img {
  width: auto;
  height: auto;
  max-width: min(86%, 180px);
  max-height: 150px;
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 10px 18px rgba(24, 39, 75, 0.12));
}

.visual-fallback {
  display: grid;
  place-items: center;
  width: 82px;
  height: 82px;
  border-radius: 50%;
  background: white;
  color: var(--ink);
  font-size: 1.4rem;
  font-weight: 900;
}

.featured-info {
  display: grid;
  grid-template-rows: auto minmax(4.2em, auto) auto;
  gap: 8px;
  padding: 16px;
}

.featured-info small {
  display: block;
  min-height: 1.45em;
}

.featured-info h3 {
  display: -webkit-box;
  min-height: 2.8em;
  margin: 0;
  overflow: hidden;
  color: var(--ink);
  font-size: 1rem;
  line-height: 1.4;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
}

.featured-info strong {
  color: var(--ink);
  font-size: 1.2rem;
}

.featured-card button {
  width: calc(100% - 32px);
  margin: auto 16px 16px;
}

.featured-card button:disabled,
.deal-card button:disabled {
  background: #c9d0d6;
  color: #59636d;
  cursor: not-allowed;
}

.feedback-panel {
  padding: 24px;
}

@keyframes shimmer {
  from { background-position: 200% 0; }
  to { background-position: -200% 0; }
}

@media (max-width: 1060px) {
  .hero-carousel,
  .hero-slide,
  .promo-grid,
  .service-strip,
  .offer-strip {
    grid-template-columns: 1fr;
  }

  .section-heading {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 680px) {
  .hero-search,
  .deal-link {
    grid-template-columns: 1fr;
  }

  .hero-search button,
  .hero-actions a {
    width: 100%;
  }

  .carousel-controls {
    position: static;
    margin-top: 16px;
  }
}
</style>
