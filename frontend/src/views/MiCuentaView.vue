<template>
  <section class="profile-page">
    <header class="profile-header">
      <div>
        <span class="eyebrow">Mi cuenta</span>
        <h1>Ordenes y datos de compra</h1>
        <p>Consulta tus pedidos realizados con tu usuario aprobado.</p>
      </div>
      <RouterLink to="/catalogo" class="shop-link">Seguir comprando</RouterLink>
    </header>

    <div v-if="!currentUser" class="empty-state">
      <strong>Inicia sesion para ver tu historial</strong>
      <p>Tambien puedes comprar como invitado desde el carrito.</p>
      <RouterLink to="/login">Ingresar</RouterLink>
    </div>

    <div v-else-if="currentUser.rol === 'admin' || currentUser.rol === 'vendedor'" class="empty-state">
      <strong>Estas usando una cuenta de tienda</strong>
      <p>El historial de clientes se gestiona desde el panel correspondiente a tu rol.</p>
      <RouterLink :to="currentUser.rol === 'admin' ? '/admin' : '/vendedor'">Ir al panel</RouterLink>
    </div>

    <div v-else class="profile-grid">
      <aside class="customer-card">
        <span class="status">{{ currentUser.estado }}</span>
        <h2>{{ currentUser.nombre }}</h2>
        <p>{{ currentUser.correo }}</p>
        <dl>
          <div>
            <dt>NIT</dt>
            <dd>{{ currentUser.nit || 'CF' }}</dd>
          </div>
          <div>
            <dt>ID cliente</dt>
            <dd>{{ currentUser.id_cliente || 'Pendiente' }}</dd>
          </div>
        </dl>
        <button type="button" @click="salir">Cerrar sesion</button>
      </aside>

      <section class="orders-panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">Historial</span>
            <h2>Mis ordenes</h2>
          </div>
          <button type="button" @click="cargarOrdenes">Actualizar</button>
        </div>

        <div v-if="cargando" class="feedback">Cargando ordenes...</div>
        <div v-else-if="mensaje" class="feedback">{{ mensaje }}</div>
        <div v-else-if="ordenes.length === 0" class="feedback">Aun no tienes ordenes registradas con esta cuenta.</div>

        <template v-else>
          <article v-for="orden in ordenes" :key="orden.id_orden" class="order-card">
            <div class="order-top">
              <div>
                <span>Orden #{{ orden.id_orden }}</span>
                <strong>{{ formatoMoneda(orden.total_con_iva) }}</strong>
              </div>
              <span class="order-state">{{ orden.estado }}</span>
            </div>

            <div class="order-meta">
              <span>{{ formatoFecha(orden.fecha_orden) }}</span>
              <span>{{ orden.cuotas_visacuotas || 1 }} cuota(s)</span>
            </div>

            <div class="order-lines">
              <div v-for="item in orden.detalle" :key="`${orden.id_orden}-${item.id_producto}`">
                <span>{{ item.cantidad }}x {{ item.producto || `Producto ${item.id_producto}` }}</span>
                <strong>{{ formatoMoneda(item.subtotal_linea) }}</strong>
              </div>
            </div>
          </article>
        </template>
      </section>
    </div>
  </section>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import api from '../services/api';
import { useSession } from '../stores/session';

const router = useRouter();
const { currentUser, logout } = useSession();
const ordenes = ref([]);
const cargando = ref(false);
const mensaje = ref('');

const formatoMoneda = (valor) => new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2
}).format(Number(valor || 0));

const formatoFecha = (fecha) => {
  if (!fecha) return 'Fecha no disponible';
  return new Intl.DateTimeFormat('es-GT', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(fecha));
};

const cargarOrdenes = async () => {
  if (!currentUser.value?.id_cliente) {
    mensaje.value = 'Tu cuenta aun no esta vinculada a un cliente aprobado.';
    return;
  }

  cargando.value = true;
  mensaje.value = '';

  try {
    const response = await api.get(`/mis-ordenes/${currentUser.value.id_cliente}`);
    ordenes.value = response.data;
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudieron cargar tus ordenes.';
  } finally {
    cargando.value = false;
  }
};

const salir = () => {
  logout();
  router.push('/login');
};

onMounted(cargarOrdenes);
</script>

<style scoped>
.profile-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.profile-header,
.panel-heading,
.order-top,
.order-meta,
.order-lines div {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.profile-header {
  align-items: flex-end;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--line);
}

.eyebrow,
.customer-card .status,
dt {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.profile-header h1 {
  margin: 8px 0;
  color: var(--ink);
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1;
}

.profile-header p,
.customer-card p,
.feedback,
.order-meta,
.order-lines {
  color: var(--muted);
  line-height: 1.55;
}

.shop-link,
.empty-state a,
.customer-card button,
.panel-heading button {
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

.profile-grid {
  display: grid;
  grid-template-columns: minmax(260px, 340px) minmax(0, 1fr);
  gap: 24px;
  align-items: start;
}

.customer-card,
.orders-panel,
.order-card,
.empty-state {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
}

.customer-card,
.orders-panel,
.empty-state {
  padding: 24px;
}

.customer-card {
  position: sticky;
  top: 96px;
}

.customer-card h2,
.panel-heading h2 {
  margin: 8px 0;
  color: var(--ink);
}

dl {
  display: grid;
  gap: 10px;
  margin: 18px 0;
}

dd {
  margin: 4px 0 0;
  color: var(--ink);
  font-weight: 900;
}

.orders-panel {
  display: grid;
  gap: 14px;
}

.panel-heading {
  align-items: center;
  margin-bottom: 4px;
}

.panel-heading button {
  background: #eef3f7;
  color: var(--ink);
}

.order-card {
  display: grid;
  gap: 12px;
  padding: 18px;
}

.order-top {
  align-items: flex-start;
}

.order-top span {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 900;
}

.order-top strong {
  display: block;
  margin-top: 4px;
  color: var(--ink);
  font-size: 1.4rem;
}

.order-state {
  border-radius: 999px;
  background: #eef5fb;
  color: var(--accent-strong);
  padding: 6px 10px;
  font-size: 0.76rem;
  font-weight: 900;
}

.order-lines {
  display: grid;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

.order-lines strong {
  color: var(--ink);
}

.empty-state {
  max-width: 720px;
}

.empty-state strong {
  display: block;
  margin-bottom: 8px;
  color: var(--ink);
  font-size: 1.25rem;
}

@media (max-width: 860px) {
  .profile-header,
  .profile-grid,
  .panel-heading,
  .order-top,
  .order-meta,
  .order-lines div {
    display: grid;
    grid-template-columns: 1fr;
  }

  .customer-card {
    position: static;
  }
}
</style>
