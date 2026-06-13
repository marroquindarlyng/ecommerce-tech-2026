<template>
  <section class="payment-page">
    <header class="payment-header">
      <div>
        <span class="eyebrow">Checkout seguro</span>
        <h1>Finalizar compra</h1>
        <p>{{ currentUser?.id_cliente ? 'Usaremos tu cuenta aprobada para registrar el pedido.' : 'Compra como invitado o inicia sesion para guardar el historial.' }}</p>
      </div>
      <RouterLink to="/carrito" class="back-link">Volver al carrito</RouterLink>
    </header>

    <div v-if="items.length === 0 && !ordenCreada" class="empty-state">
      <strong>No hay productos por pagar</strong>
      <p>Agrega articulos al carrito para continuar con el checkout.</p>
      <RouterLink to="/catalogo">Ver catalogo</RouterLink>
    </div>

    <div v-else-if="ordenCreada" class="success-panel">
      <span>Orden creada</span>
      <h2>Gracias por tu compra</h2>
      <p>Tu pedido fue registrado correctamente y quedo listo para seguimiento.</p>
      <div class="success-data">
        <strong>#{{ ordenCreada.id_orden }}</strong>
        <small>Estado: {{ ordenCreada.estado || 'PENDIENTE' }}</small>
      </div>
      <RouterLink to="/catalogo">Seguir comprando</RouterLink>
    </div>

    <form v-else class="payment-grid" @submit.prevent="confirmarPago">
      <section class="form-stack">
        <article class="form-card">
          <div class="card-heading">
            <span>1</span>
            <div>
              <h2>Datos del comprador</h2>
              <p>{{ currentUser?.id_cliente ? 'Estos datos vienen de tu cuenta aprobada.' : 'Usaremos esta informacion para crear el cliente invitado.' }}</p>
            </div>
          </div>

          <div class="field-grid">
            <label>
              <span>Nombre completo</span>
              <input v-model.trim="cliente.nombre_completo" required type="text" placeholder="Nombre y apellido">
            </label>
            <label>
              <span>Correo</span>
              <input v-model.trim="cliente.correo" required type="email" placeholder="correo@dominio.com">
            </label>
            <label>
              <span>NIT</span>
              <input v-model.trim="cliente.nit" type="text" placeholder="CF o NIT">
            </label>
            <label>
              <span>Telefono</span>
              <input v-model.trim="cliente.telefono" type="tel" placeholder="+502 0000-0000">
            </label>
          </div>
        </article>

        <article class="form-card">
          <div class="card-heading">
            <span>2</span>
            <div>
              <h2>Entrega</h2>
              <p>Elige como quieres recibir tu pedido.</p>
            </div>
          </div>

          <div class="segmented">
            <button
              type="button"
              :class="{ active: entrega === 'domicilio' }"
              @click="entrega = 'domicilio'"
            >
              Envio a domicilio
            </button>
            <button
              type="button"
              :class="{ active: entrega === 'tienda' }"
              @click="entrega = 'tienda'"
            >
              Recoger en tienda
            </button>
          </div>

          <label v-if="entrega === 'domicilio'" class="full-field">
            <span>Direccion de envio</span>
            <textarea v-model.trim="cliente.direccion_envio" required rows="3" placeholder="Direccion, municipio, departamento"></textarea>
          </label>

          <label v-else class="full-field">
            <span>Sucursal</span>
            <select v-model="sucursal">
              <option>Zona 10</option>
              <option>Miraflores</option>
              <option>Carretera a El Salvador</option>
              <option>Quetzaltenango</option>
            </select>
          </label>
        </article>

        <article class="form-card">
          <div class="card-heading">
            <span>3</span>
            <div>
              <h2>Metodo de pago</h2>
              <p>Selecciona la forma de pago que prefieras para completar tu pedido.</p>
            </div>
          </div>

          <div class="field-grid">
            <label>
              <span>Metodo de pago</span>
              <select v-model="metodoPago">
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="efectivo">Efectivo contra entrega</option>
              </select>
            </label>
            <label>
              <span>VisaCuotas</span>
              <select v-model.number="cuotas">
                <option :value="1">1 cuota</option>
                <option :value="3">3 cuotas</option>
                <option :value="6">6 cuotas</option>
                <option :value="10">10 cuotas</option>
                <option :value="12">12 cuotas</option>
              </select>
            </label>
            <label v-if="metodoPago === 'tarjeta'">
              <span>Numero de tarjeta</span>
              <input v-model.trim="tarjeta.numero" required inputmode="numeric" maxlength="19" placeholder="4111 1111 1111 1111">
            </label>
            <label v-if="metodoPago === 'tarjeta'">
              <span>Nombre en tarjeta</span>
              <input v-model.trim="tarjeta.nombre" required type="text" placeholder="Como aparece en la tarjeta">
            </label>
          </div>
        </article>
      </section>

      <aside class="order-panel">
        <div class="summary-card">
          <h2>Resumen de compra</h2>

          <div class="order-items">
            <div v-for="item in items" :key="item.id_producto" class="order-item">
              <span>{{ item.cantidad }}x</span>
              <strong>{{ item.nombre }}</strong>
              <small>{{ formatoMoneda(item.precio * item.cantidad) }}</small>
            </div>
          </div>

          <div class="divider"></div>

          <div class="summary-line">
            <span>Subtotal</span>
            <strong>{{ formatoMoneda(subtotal) }}</strong>
          </div>
          <div class="summary-line">
            <span>IVA 12%</span>
            <strong>{{ formatoMoneda(iva) }}</strong>
          </div>
          <div class="summary-line muted">
            <span>Entrega</span>
            <strong>{{ entrega === 'domicilio' ? 'Por confirmar' : 'Q0.00' }}</strong>
          </div>
          <div class="summary-line total">
            <span>Total</span>
            <strong>{{ formatoMoneda(total) }}</strong>
          </div>

          <button type="submit" class="pay-button" :disabled="procesando">
            {{ procesando ? 'Registrando orden...' : 'Pagar pedido' }}
          </button>

          <p v-if="mensaje" class="message">{{ mensaje }}</p>
        </div>
      </aside>
    </form>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue';
import api from '../services/api';
import { useCart } from '../stores/cart';
import { useSession } from '../stores/session';

const { items, subtotal, iva, total, clearCart } = useCart();
const { currentUser } = useSession();
const entrega = ref('domicilio');
const sucursal = ref('Zona 10');
const metodoPago = ref('tarjeta');
const cuotas = ref(1);
const procesando = ref(false);
const mensaje = ref('');
const ordenCreada = ref(null);

const cliente = reactive({
  nombre_completo: currentUser.value?.nombre || '',
  correo: currentUser.value?.correo || '',
  nit: currentUser.value?.nit || 'CF',
  telefono: currentUser.value?.telefono || '',
  direccion_envio: currentUser.value?.direccion_envio || ''
});

const tarjeta = reactive({
  numero: '',
  nombre: ''
});

const formatoMoneda = (valor) => new Intl.NumberFormat('es-GT', {
  style: 'currency',
  currency: 'GTQ',
  minimumFractionDigits: 2
}).format(Number(valor || 0));

const confirmarPago = async () => {
  procesando.value = true;
  mensaje.value = '';

  try {
    const direccion = entrega.value === 'domicilio'
      ? cliente.direccion_envio
      : `Recoger en tienda: ${sucursal.value}`;

    let idCliente = currentUser.value?.id_cliente || null;

    if (!idCliente) {
      const clienteRes = await api.post('/cliente', {
        nit: cliente.nit || 'CF',
        nombre_completo: cliente.nombre_completo,
        correo: cliente.correo,
        direccion_envio: direccion
      });

      idCliente = clienteRes.data.data.id_cliente;
    }

    const ordenRes = await api.post('/carrito/confirmar', {
      id_cliente: idCliente,
      subtotal: subtotal.value,
      monto_iva: iva.value,
      total_con_iva: total.value,
      cuotas_visacuotas: cuotas.value,
      productos: items.value.map((item) => ({
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio
      }))
    });

    ordenCreada.value = ordenRes.data.data;
    clearCart();
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo completar el pago.';
    console.error(err);
  } finally {
    procesando.value = false;
  }
};
</script>

<style scoped>
.payment-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.payment-header {
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
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.payment-header h1 {
  margin: 6px 0 8px;
  color: var(--ink);
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1;
}

.payment-header p,
.card-heading p,
.message,
.empty-state p,
.success-panel p {
  color: var(--muted);
  line-height: 1.55;
}

.back-link,
.empty-state a,
.success-panel a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 42px;
  border-radius: 6px;
  background: var(--ink);
  color: white;
  padding: 0 16px;
  text-decoration: none;
  font-weight: 900;
}

.payment-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 400px);
  gap: 24px;
  align-items: start;
}

.form-stack {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-card,
.summary-card,
.empty-state,
.success-panel {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
}

.form-card,
.summary-card,
.empty-state,
.success-panel {
  padding: 24px;
}

.card-heading {
  display: flex;
  gap: 14px;
  margin-bottom: 18px;
}

.card-heading > span {
  display: grid;
  place-items: center;
  flex: 0 0 36px;
  height: 36px;
  border-radius: 50%;
  background: #eef3f7;
  color: var(--accent-strong);
  font-weight: 900;
}

.card-heading h2,
.summary-card h2,
.success-panel h2 {
  margin: 0 0 4px;
  color: var(--ink);
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

label,
.full-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

label span {
  color: var(--muted);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  padding: 0 12px;
  font: inherit;
}

input,
select {
  height: 42px;
}

textarea {
  padding-block: 10px;
  resize: vertical;
}

.segmented {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 14px;
}

.segmented button {
  min-height: 42px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.segmented button.active {
  border-color: var(--accent);
  background: #eef5fb;
  color: var(--accent-strong);
}

.order-panel {
  position: sticky;
  top: 112px;
}

.order-items {
  display: grid;
  gap: 10px;
  max-height: 240px;
  overflow: auto;
  padding-right: 4px;
}

.order-item {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  color: var(--muted);
  font-size: 0.9rem;
}

.order-item strong {
  overflow: hidden;
  color: var(--ink);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.divider {
  height: 1px;
  margin: 18px 0;
  background: var(--line);
}

.summary-line {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 12px;
  color: var(--muted);
}

.summary-line strong {
  color: var(--ink);
}

.summary-line.total {
  color: var(--ink);
  font-size: 1.12rem;
  font-weight: 900;
}

.summary-line.total strong {
  font-size: 1.45rem;
}

.pay-button {
  width: 100%;
  min-height: 48px;
  margin-top: 12px;
  border: 0;
  border-radius: 6px;
  background: var(--ink);
  color: white;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.pay-button:disabled {
  background: #c9d0d6;
  color: #59636d;
  cursor: not-allowed;
}

.success-panel {
  display: grid;
  gap: 14px;
  max-width: 720px;
}

.success-panel > span {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.success-data {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f9fbfc;
}

.success-data strong {
  color: var(--ink);
  font-size: 1.6rem;
}

.success-data small {
  color: var(--muted);
  font-weight: 900;
}

@media (max-width: 920px) {
  .payment-header,
  .payment-grid {
    grid-template-columns: 1fr;
  }

  .payment-header {
    align-items: stretch;
    flex-direction: column;
  }

  .order-panel {
    position: static;
  }
}

@media (max-width: 680px) {
  .field-grid,
  .segmented {
    grid-template-columns: 1fr;
  }
}
</style>
