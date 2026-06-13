<template>
  <section class="seller-page">
    <header class="seller-header">
      <div>
        <span class="eyebrow">Vendedor</span>
        <h1>Operacion diaria</h1>
        <p>Gestiona pedidos vigentes, disponibilidad y alertas de inventario.</p>
      </div>
      <button v-if="isStaff" type="button" @click="salir">Cerrar sesion</button>
    </header>

    <div v-if="!isStaff" class="empty-state">
      <strong>Necesitas acceso de tienda</strong>
      <p>Ingresa con un usuario vendedor o administrador.</p>
      <RouterLink to="/login">Ingresar</RouterLink>
    </div>

    <template v-else>
      <section class="metric-grid">
        <article>
          <span>Ordenes vigentes</span>
          <strong>{{ resumen.ordenes_vigentes || 0 }}</strong>
        </article>
        <article>
          <span>Productos en alerta</span>
          <strong>{{ resumen.stock_bajo || 0 }}</strong>
        </article>
        <article>
          <span>Productos activos</span>
          <strong>{{ resumen.productos || 0 }}</strong>
        </article>
        <article>
          <span>Ventas registradas</span>
          <strong>{{ formatoMoneda(resumen.ventas) }}</strong>
        </article>
      </section>

      <div class="tabs">
        <button type="button" :class="{ active: tab === 'ordenes' }" @click="tab = 'ordenes'">Ordenes</button>
        <button type="button" :class="{ active: tab === 'stock' }" @click="tab = 'stock'">Stock</button>
        <button type="button" :class="{ active: tab === 'nuevo' }" @click="tab = 'nuevo'">Nuevo producto</button>
        <button type="button" :class="{ active: tab === 'solicitudes' }" @click="tab = 'solicitudes'">Solicitudes</button>
      </div>

      <section v-if="tab === 'ordenes'" class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">Pedidos</span>
            <h2>Ordenes vigentes</h2>
          </div>
          <button type="button" @click="cargarTodo">Actualizar</button>
        </div>

        <p v-if="mensaje" class="message">{{ mensaje }}</p>
        <div v-if="ordenes.length === 0" class="feedback">No hay ordenes vigentes.</div>

        <template v-else>
          <article v-for="orden in ordenes" :key="orden.id_orden" class="order-card">
            <div>
              <span>Orden #{{ orden.id_orden }}</span>
              <h3>{{ orden.cliente || `Cliente ${orden.id_cliente}` }}</h3>
              <p>{{ orden.correo || 'Correo no registrado' }}</p>
            </div>
            <div class="order-side">
              <strong>{{ formatoMoneda(orden.total_con_iva) }}</strong>
              <small>{{ orden.lineas }} linea(s)</small>
              <select :value="orden.estado" @change="actualizarEstado(orden.id_orden, $event.target.value)">
                <option>PENDIENTE</option>
                <option>PAGADO</option>
                <option>PREPARANDO</option>
                <option>ENVIADO</option>
                <option>ENTREGADO</option>
                <option>CANCELADO</option>
              </select>
            </div>
          </article>
        </template>
      </section>

      <section v-else-if="tab === 'stock'" class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">Inventario</span>
            <h2>Stock de productos</h2>
          </div>
          <input v-model.trim="busqueda" type="search" placeholder="Buscar producto o SKU">
        </div>

        <div class="stock-grid">
          <article v-for="producto in productosFiltrados" :key="producto.id_producto" class="stock-card">
            <div class="product-thumb">
              <img v-if="producto.imagen" :src="producto.imagen" :alt="producto.nombre">
              <span v-else>{{ iniciales(producto.nombre) }}</span>
            </div>
            <div>
              <small>{{ producto.categoria || 'Sin categoria' }}</small>
              <h3>{{ producto.nombre }}</h3>
              <code>{{ producto.codigo_sku || `ID ${producto.id_producto}` }}</code>
            </div>
            <div class="stock-count" :class="{ low: producto.stock <= 5 }">
              <span>Stock</span>
              <strong>{{ producto.stock }}</strong>
            </div>
          </article>
        </div>
      </section>

      <section v-else-if="tab === 'nuevo'" class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">Catalogo</span>
            <h2>Proponer producto</h2>
          </div>
        </div>

        <form class="product-form" @submit.prevent="crearProducto">
          <label>
            <span>Categoria</span>
            <select v-model.number="productoForm.id_categoria" required>
              <option disabled :value="0">Seleccionar</option>
              <option v-for="categoria in categorias" :key="categoria.id_categoria" :value="categoria.id_categoria">
                {{ categoria.nombre }}
              </option>
            </select>
          </label>
          <label>
            <span>SKU</span>
            <input v-model.trim="productoForm.codigo_sku" required type="text" placeholder="SKU-PROD-001">
          </label>
          <label>
            <span>Nombre</span>
            <input v-model.trim="productoForm.nombre" required type="text" placeholder="Nombre comercial">
          </label>
          <label>
            <span>Precio</span>
            <input v-model.number="productoForm.precio_unitario" required min="0.01" step="0.01" type="number">
          </label>
          <label>
            <span>Stock</span>
            <input v-model.number="productoForm.stock_actual" required min="0" step="1" type="number">
          </label>
          <label>
            <span>Subir imagen</span>
            <input type="file" accept="image/*" @change="subirImagenProducto">
            <small v-if="subiendoImagenProducto">Cargando imagen...</small>
          </label>
          <label>
            <span>Ruta imagen</span>
            <input v-model.trim="productoForm.url_galeria" type="text" placeholder="/uploads/productos/nuevo-producto.jpg">
          </label>
          <div v-if="imagenProductoPreview" class="upload-preview">
            <img :src="imagenProductoPreview" :alt="productoForm.nombre || 'Vista previa de producto'">
          </div>
          <label class="full-field">
            <span>Ficha tecnica</span>
            <textarea v-model.trim="productoForm.ficha_tecnica" rows="4" placeholder="Especificaciones principales"></textarea>
          </label>
          <button type="submit" :disabled="procesando">Enviar a aprobacion</button>
        </form>
      </section>

      <section v-else class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">Revision</span>
            <h2>Mis solicitudes</h2>
          </div>
          <button type="button" @click="cargarTodo">Actualizar</button>
        </div>

        <div v-if="solicitudesProducto.length === 0" class="feedback">No hay solicitudes de producto.</div>
        <template v-else>
          <article v-for="solicitud in solicitudesProducto" :key="solicitud.id_solicitud" class="request-card">
            <div>
              <span class="state" :class="solicitud.estado.toLowerCase()">{{ solicitud.estado }}</span>
              <h3>{{ solicitud.nombre }}</h3>
              <p>{{ solicitud.categoria || 'Sin categoria' }} | {{ solicitud.codigo_sku }}</p>
            </div>
            <div>
              <strong>{{ formatoMoneda(solicitud.precio_unitario) }}</strong>
              <small>{{ solicitud.stock_actual }} unidades</small>
            </div>
          </article>
        </template>
      </section>
    </template>
  </section>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import { resolveAssetUrl } from '../services/assets';
import { useSession } from '../stores/session';

const router = useRouter();
const { isStaff, currentUser, logout } = useSession();
const resumen = ref({});
const ordenes = ref([]);
const productos = ref([]);
const categorias = ref([]);
const solicitudesProducto = ref([]);
const mensaje = ref('');
const procesando = ref(false);
const subiendoImagenProducto = ref(false);
const tab = ref('ordenes');
const busqueda = ref('');

const staffHeaders = computed(() => ({
  headers: {
    'x-user-role': currentUser.value?.rol || '',
    'x-user-id': currentUser.value?.id || ''
  }
}));

const productoForm = ref({
  id_categoria: 0,
  codigo_sku: '',
  nombre: '',
  precio_unitario: 0,
  stock_actual: 0,
  ficha_tecnica: '',
  url_galeria: ''
});

const imagenProductoPreview = computed(() => resolveAssetUrl(productoForm.value.url_galeria));

const productosFiltrados = computed(() => {
  const texto = busqueda.value.toLowerCase();
  return productos.value.filter((producto) => {
    const contenido = [producto.nombre, producto.codigo_sku, producto.categoria].filter(Boolean).join(' ').toLowerCase();
    return !texto || contenido.includes(texto);
  });
});

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

const cargarTodo = async () => {
  if (!isStaff.value) return;
  mensaje.value = '';

  try {
    const [resumenRes, ordenesRes, stockRes, categoriasRes, solicitudesRes] = await Promise.all([
      api.get('/staff/resumen', staffHeaders.value),
      api.get('/staff/ordenes-vigentes', staffHeaders.value),
      api.get('/staff/stock', staffHeaders.value),
      api.get('/categorias'),
      api.get('/staff/solicitudes-producto', staffHeaders.value)
    ]);

    resumen.value = resumenRes.data;
    ordenes.value = ordenesRes.data;
    productos.value = stockRes.data.map((producto) => ({
      ...producto,
      imagen: resolveAssetUrl(producto.imagen)
    }));
    categorias.value = categoriasRes.data;
    solicitudesProducto.value = solicitudesRes.data;
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo cargar la vista de vendedor.';
  }
};

const actualizarEstado = async (idOrden, estado) => {
  try {
    await api.patch(`/admin/ordenes/${idOrden}`, { estado }, staffHeaders.value);
    await cargarTodo();
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo actualizar la orden.';
  }
};

const subirImagenProducto = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('imagen', file);
  subiendoImagenProducto.value = true;
  mensaje.value = '';

  try {
    const response = await api.post('/uploads/productos', formData, {
      headers: staffHeaders.value.headers
    });
    productoForm.value.url_galeria = response.data.data.url;
    mensaje.value = response.data.mensaje;
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo cargar la imagen.';
  } finally {
    subiendoImagenProducto.value = false;
    event.target.value = '';
  }
};

const crearProducto = async () => {
  procesando.value = true;
  mensaje.value = '';

  try {
    const response = await api.post('/staff/productos', productoForm.value, staffHeaders.value);
    mensaje.value = response.data.mensaje;
    productoForm.value = {
      id_categoria: 0,
      codigo_sku: '',
      nombre: '',
      precio_unitario: 0,
      stock_actual: 0,
      ficha_tecnica: '',
      url_galeria: ''
    };
    tab.value = 'solicitudes';
    await cargarTodo();
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo enviar el producto.';
  } finally {
    procesando.value = false;
  }
};

const salir = () => {
  logout();
  router.push('/login');
};

onMounted(cargarTodo);
</script>

<style scoped>
.seller-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.seller-header,
.panel-heading,
.order-card,
.stock-card,
.request-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.seller-header {
  align-items: flex-end;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--line);
}

.eyebrow,
.metric-grid span,
.order-card > div > span,
.stock-count span,
.state {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.seller-header h1 {
  margin: 8px 0;
  color: var(--ink);
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1;
}

.seller-header p,
.order-card p,
.request-card p,
.request-card small,
.message,
.feedback,
.empty-state p,
.stock-card small {
  color: var(--muted);
  line-height: 1.55;
}

button,
.empty-state a {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 42px;
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

.metric-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
}

.metric-grid article,
.panel,
.order-card,
.stock-card,
.request-card,
.empty-state {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
}

.metric-grid article,
.panel,
.empty-state {
  padding: 24px;
}

.metric-grid strong {
  display: block;
  margin-top: 8px;
  color: var(--ink);
  font-size: 1.8rem;
}

.tabs {
  display: flex;
  gap: 8px;
}

.tabs button {
  background: #eef3f7;
  color: var(--ink);
}

.tabs button.active {
  background: var(--ink);
  color: white;
}

.panel {
  display: grid;
  gap: 14px;
}

.panel-heading {
  align-items: center;
}

.panel-heading h2,
.order-card h3,
.stock-card h3 {
  margin: 6px 0;
  color: var(--ink);
}

.panel-heading input,
select {
  height: 40px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  padding: 0 12px;
  font: inherit;
}

.order-card {
  align-items: center;
  padding: 18px;
}

.request-card {
  align-items: center;
  padding: 18px;
}

.request-card h3 {
  margin: 6px 0;
  color: var(--ink);
}

.request-card strong {
  display: block;
  color: var(--ink);
  font-size: 1.25rem;
}

.state {
  display: inline-flex;
  border-radius: 999px;
  background: #eef5fb;
  padding: 6px 10px;
}

.state.aprobado {
  background: #edf7ee;
  color: #2e7d32;
}

.state.denegado {
  background: #fbefee;
  color: #8c1d18;
}

.order-side {
  display: grid;
  gap: 6px;
  justify-items: end;
}

.order-side strong {
  color: var(--ink);
  font-size: 1.3rem;
}

.order-side small {
  color: var(--muted);
  font-weight: 800;
}

.stock-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
}

.stock-card {
  align-items: center;
  padding: 14px;
}

.product-thumb {
  display: grid;
  place-items: center;
  flex: 0 0 76px;
  width: 76px;
  height: 76px;
  border-radius: 8px;
  background: #eef3f7;
  padding: 8px;
}

.product-thumb img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.product-thumb span {
  color: var(--ink);
  font-weight: 900;
}

.stock-card code {
  color: var(--accent);
  font-size: 0.75rem;
  font-weight: 800;
}

.stock-count {
  min-width: 76px;
  border-radius: 8px;
  background: #edf7ee;
  padding: 10px;
  text-align: center;
}

.stock-count.low {
  background: #fff4e8;
}

.stock-count strong {
  display: block;
  color: var(--ink);
  font-size: 1.6rem;
}

.product-form {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  border: 1px solid rgba(31, 105, 161, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(31, 105, 161, 0.07), rgba(182, 93, 19, 0.06)),
    #fff;
  padding: 16px;
}

.product-form label {
  display: grid;
  gap: 7px;
}

.product-form label span {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.product-form input,
.product-form select,
.product-form textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  padding: 0 12px;
  font: inherit;
}

.product-form input,
.product-form select {
  height: 42px;
}

.product-form input[type="file"] {
  height: auto;
  padding: 9px 12px;
}

.product-form small {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 800;
}

.upload-preview {
  display: grid;
  place-items: center;
  min-height: 132px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fbfd;
  padding: 12px;
}

.upload-preview img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 150px;
  object-fit: contain;
  filter: drop-shadow(0 10px 16px rgba(24, 39, 75, 0.12));
}

.product-form textarea {
  padding-block: 10px;
  resize: vertical;
}

.full-field {
  grid-column: 1 / -1;
}

@media (max-width: 900px) {
  .seller-header,
  .order-card,
  .panel-heading,
  .stock-card,
  .request-card {
    display: grid;
    grid-template-columns: 1fr;
  }

  .metric-grid,
  .product-form {
    grid-template-columns: 1fr 1fr;
  }

  .order-side {
    justify-items: stretch;
  }
}

@media (max-width: 620px) {
  .metric-grid,
  .product-form {
    grid-template-columns: 1fr;
  }
}
</style>
