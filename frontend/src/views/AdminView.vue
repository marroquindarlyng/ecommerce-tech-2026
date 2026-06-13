<template>
  <section class="admin-page">
    <header class="admin-header">
      <div>
        <span class="eyebrow">Panel admin</span>
        <h1>Operaciones de tienda</h1>
        <p>Controla usuarios, KPIs, clientes, pedidos y aprobaciones desde una sola vista.</p>
      </div>
      <button v-if="isAdmin" type="button" @click="salir">Cerrar sesion</button>
    </header>

    <div v-if="!isAdmin" class="empty-state">
      <strong>Necesitas una cuenta administradora</strong>
      <p>Ingresa con el usuario admin para gestionar solicitudes y ordenes.</p>
      <RouterLink to="/login">Ingresar</RouterLink>
    </div>

    <template v-else>
      <section class="metric-grid">
        <article>
          <span>Solicitudes pendientes</span>
          <strong>{{ pendientes.length }}</strong>
        </article>
        <article>
          <span>Ordenes totales</span>
          <strong>{{ kpis.ordenes || ordenes.length }}</strong>
        </article>
        <article>
          <span>Ventas registradas</span>
          <strong>{{ formatoMoneda(kpis.ventas || totalVentas) }}</strong>
        </article>
        <article>
          <span>Ticket promedio</span>
          <strong>{{ formatoMoneda(kpis.ticket_promedio) }}</strong>
        </article>
        <article>
          <span>Clientes</span>
          <strong>{{ kpis.clientes || clientes.length }}</strong>
        </article>
        <article>
          <span>Stock bajo</span>
          <strong>{{ kpis.stock_bajo || 0 }}</strong>
        </article>
      </section>

      <div class="tabs">
        <button type="button" :class="{ active: tab === 'solicitudes' }" @click="tab = 'solicitudes'">
          Solicitudes
        </button>
        <button type="button" :class="{ active: tab === 'ordenes' }" @click="tab = 'ordenes'">
          Ordenes
        </button>
        <button type="button" :class="{ active: tab === 'usuarios' }" @click="tab = 'usuarios'">
          Usuarios
        </button>
        <button type="button" :class="{ active: tab === 'clientes' }" @click="tab = 'clientes'">
          Clientes
        </button>
        <button type="button" :class="{ active: tab === 'productos' }" @click="tab = 'productos'">
          Productos
        </button>
      </div>

      <section v-if="tab === 'solicitudes'" class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">Clientes</span>
            <h2>Validacion de cuentas</h2>
          </div>
          <button type="button" @click="cargarTodo">Actualizar</button>
        </div>

        <p v-if="mensaje" class="message">{{ mensaje }}</p>

        <div v-if="solicitudes.length === 0" class="feedback">No hay solicitudes registradas.</div>

        <template v-else>
          <article v-for="solicitud in solicitudes" :key="solicitud.id" class="request-card">
            <div>
              <span class="state" :class="solicitud.estado.toLowerCase()">{{ solicitud.estado }}</span>
              <h3>{{ solicitud.nombre }}</h3>
              <p>{{ solicitud.correo }}</p>
              <small>NIT: {{ solicitud.nit || 'CF' }} | ID cliente: {{ solicitud.id_cliente || 'Sin vincular' }}</small>
            </div>
            <div class="actions">
              <button
                type="button"
                :disabled="solicitud.estado === 'APROBADO' || procesando"
                @click="validarSolicitud(solicitud.id, 'aprobar')"
              >
                Aprobar
              </button>
              <button
                type="button"
                class="danger"
                :disabled="solicitud.estado === 'DENEGADO' || procesando"
                @click="validarSolicitud(solicitud.id, 'denegar')"
              >
                Denegar
              </button>
            </div>
          </article>
        </template>
      </section>

      <section v-else-if="tab === 'ordenes'" class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">Pedidos</span>
            <h2>Ordenes recientes</h2>
          </div>
          <button type="button" @click="cargarTodo">Actualizar</button>
        </div>

        <div v-if="ordenes.length === 0" class="feedback">Aun no hay ordenes registradas.</div>

        <template v-else>
          <article v-for="orden in ordenes" :key="orden.id_orden" class="order-card">
            <div class="order-main">
              <div>
                <span>Orden #{{ orden.id_orden }}</span>
                <h3>{{ orden.cliente || `Cliente ${orden.id_cliente}` }}</h3>
                <p>{{ orden.correo || 'Correo no registrado' }}</p>
              </div>
              <strong>{{ formatoMoneda(orden.total_con_iva) }}</strong>
            </div>

            <div class="order-footer">
              <span>{{ formatoFecha(orden.fecha_orden) }}</span>
              <span>{{ orden.lineas }} linea(s)</span>
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

      <section v-else-if="tab === 'usuarios'" class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">Accesos</span>
            <h2>Usuarios del portal</h2>
          </div>
          <button type="button" @click="cargarTodo">Actualizar</button>
        </div>

        <form class="inline-form" @submit.prevent="crearUsuario">
          <input v-model.trim="usuarioForm.nombre" required type="text" placeholder="Nombre">
          <input v-model.trim="usuarioForm.correo" required type="email" placeholder="Correo">
          <input v-model="usuarioForm.password" required minlength="6" type="password" placeholder="Contrasena">
          <select v-model="usuarioForm.rol">
            <option value="vendedor">Vendedor</option>
            <option value="admin">Admin</option>
          </select>
          <button type="submit" :disabled="procesando">Crear usuario</button>
        </form>

        <article v-for="usuario in usuarios" :key="usuario.id" class="user-card portal-user-card">
          <div class="user-profile">
            <div class="user-avatar">{{ iniciales(usuario.nombre) }}</div>
            <div>
              <span class="state" :class="usuario.estado.toLowerCase()">{{ usuario.estado }}</span>
              <h3>{{ usuario.nombre }}</h3>
              <p>{{ usuario.correo }}</p>
              <small>{{ usuario.rol }} | NIT: {{ usuario.nit || 'CF' }}</small>
            </div>
          </div>

          <div class="user-actions user-editor">
            <label>
              <span>Nombre</span>
              <input v-model.trim="usuario.nombre" :disabled="usuario.rol === 'cliente'" type="text">
            </label>
            <label>
              <span>Correo</span>
              <input v-model.trim="usuario.correo" :disabled="usuario.rol === 'cliente'" type="email">
            </label>
            <label>
              <span>Telefono</span>
              <input v-model.trim="usuario.telefono" :disabled="usuario.rol === 'cliente'" type="text" placeholder="Sin registrar">
            </label>
            <label>
              <span>NIT</span>
              <input v-model.trim="usuario.nit" :disabled="usuario.rol === 'cliente'" type="text">
            </label>
            <label>
              <span>Nueva clave</span>
              <input v-model="usuario.password_temp" :disabled="usuario.rol === 'cliente'" type="password" placeholder="Opcional">
            </label>
            <label>
              <span>Rol</span>
              <select
                :value="usuario.rol"
                :disabled="usuario.rol === 'cliente'"
                @change="actualizarUsuario(usuario.id, { rol: $event.target.value })"
              >
                <option value="admin">Admin</option>
                <option value="vendedor">Vendedor</option>
                <option value="cliente" disabled>Cliente</option>
              </select>
            </label>
            <label>
              <span>Estado</span>
              <select
                :value="usuario.estado"
                :disabled="usuario.rol === 'cliente'"
                @change="actualizarUsuario(usuario.id, { estado: $event.target.value })"
              >
                <option>PENDIENTE</option>
                <option>APROBADO</option>
                <option>DENEGADO</option>
              </select>
            </label>
          </div>

          <div class="user-card-footer">
            <div>
              <span>Contacto</span>
              <strong>{{ usuario.telefono || 'Sin telefono' }}</strong>
            </div>
            <div>
              <span>Validacion</span>
              <strong>{{ usuario.validated_at ? formatoFecha(usuario.validated_at) : 'Sin fecha' }}</strong>
            </div>
            <div class="user-card-buttons">
            <button
              type="button"
              :disabled="usuario.rol === 'cliente'"
              @click="guardarUsuario(usuario)"
            >
              Guardar
            </button>
            <button
              type="button"
              class="danger"
              :disabled="usuario.rol === 'cliente'"
              @click="eliminarUsuario(usuario.id)"
            >
              Eliminar
            </button>
            </div>
          </div>
        </article>
      </section>

      <section v-else-if="tab === 'clientes'" class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">Clientes</span>
            <h2>Clientes registrados</h2>
          </div>
          <button type="button" @click="cargarTodo">Actualizar</button>
        </div>

        <div class="client-toolbar">
          <label>
            <span>Buscar cliente</span>
            <input v-model.trim="busquedaClientes" type="search" placeholder="Nombre, correo o NIT">
          </label>
          <div>
            <small>Total clientes</small>
            <strong>{{ clientesFiltrados.length }}</strong>
          </div>
        </div>

        <div v-if="clientesFiltrados.length === 0" class="feedback">No hay clientes registrados.</div>

        <template v-else>
          <div class="client-grid">
            <article v-for="cliente in clientesFiltrados" :key="cliente.id_cliente" class="client-card">
              <div class="client-main">
                <div class="client-avatar">{{ iniciales(cliente.nombre_completo) }}</div>
                <div>
                  <span>Cliente #{{ cliente.id_cliente }}</span>
                  <h3>{{ cliente.nombre_completo }}</h3>
                  <p>{{ cliente.correo }}</p>
                </div>
              </div>

              <div class="client-meta">
                <div>
                  <small>NIT</small>
                  <strong>{{ cliente.nit || 'CF' }}</strong>
                </div>
                <div>
                  <small>Contacto</small>
                  <strong>{{ cliente.correo ? 'Correo registrado' : 'Sin correo' }}</strong>
                </div>
              </div>

              <div class="client-address">
                <small>Direccion de entrega</small>
                <p>{{ cliente.direccion_envio || 'Sin direccion registrada' }}</p>
              </div>
            </article>
          </div>
        </template>
      </section>

      <section v-else class="panel">
        <div class="panel-heading">
          <div>
            <span class="eyebrow">Catalogo</span>
            <h2>Productos y aprobaciones</h2>
          </div>
          <button type="button" @click="cargarTodo">Actualizar</button>
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
            <textarea v-model.trim="productoForm.ficha_tecnica" rows="3" placeholder="Especificaciones principales"></textarea>
          </label>
          <div class="form-actions full-field">
            <button type="submit" :disabled="procesando">
              {{ productoForm.id_producto ? 'Guardar cambios' : 'Publicar producto' }}
            </button>
            <button v-if="productoForm.id_producto" type="button" class="ghost" @click="limpiarProductoForm">
              Cancelar edicion
            </button>
          </div>
        </form>

        <div class="subheading">
          <span class="eyebrow">Inventario</span>
          <h3>Productos publicados</h3>
        </div>

        <div v-if="productosAdmin.length === 0" class="feedback">No hay productos publicados.</div>
        <div v-else class="admin-product-grid">
          <article v-for="producto in productosAdmin" :key="producto.id_producto" class="admin-product-card">
            <div class="admin-product-thumb">
              <img v-if="producto.imagen_resuelta" :src="producto.imagen_resuelta" :alt="producto.nombre">
              <span v-else>{{ iniciales(producto.nombre) }}</span>
            </div>
            <div>
              <small>{{ producto.categoria || 'Sin categoria' }}</small>
              <h3>{{ producto.nombre }}</h3>
              <p>{{ producto.codigo_sku || `ID ${producto.id_producto}` }}</p>
              <strong>{{ formatoMoneda(producto.precio_unitario) }}</strong>
              <em>{{ producto.stock_actual }} unidades</em>
            </div>
            <div class="actions">
              <button type="button" @click="editarProducto(producto)">Editar</button>
              <button type="button" class="danger" @click="eliminarProducto(producto.id_producto)">Eliminar</button>
            </div>
          </article>
        </div>

        <div class="subheading">
          <span class="eyebrow">Revision</span>
          <h3>Solicitudes de vendedores</h3>
        </div>

        <div v-if="solicitudesProducto.length === 0" class="feedback">No hay solicitudes de producto.</div>
        <template v-else>
          <article v-for="solicitud in solicitudesProducto" :key="solicitud.id_solicitud" class="product-request">
            <div>
              <span class="state" :class="solicitud.estado.toLowerCase()">{{ solicitud.estado }}</span>
              <h3>{{ solicitud.nombre }}</h3>
              <p>{{ solicitud.categoria || 'Sin categoria' }} | {{ solicitud.codigo_sku }}</p>
              <small>Solicita: {{ solicitud.solicitante || 'Equipo de tienda' }}</small>
            </div>
            <div>
              <strong>{{ formatoMoneda(solicitud.precio_unitario) }}</strong>
              <small>{{ solicitud.stock_actual }} unidades</small>
            </div>
            <div class="actions">
              <button
                type="button"
                :disabled="solicitud.estado !== 'PENDIENTE' || procesando"
                @click="resolverSolicitudProducto(solicitud.id_solicitud, 'aprobar')"
              >
                Aprobar
              </button>
              <button
                type="button"
                class="danger"
                :disabled="solicitud.estado !== 'PENDIENTE' || procesando"
                @click="resolverSolicitudProducto(solicitud.id_solicitud, 'denegar')"
              >
                Denegar
              </button>
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
const { isAdmin, currentUser, logout } = useSession();
const tab = ref('solicitudes');
const solicitudes = ref([]);
const ordenes = ref([]);
const usuarios = ref([]);
const clientes = ref([]);
const categorias = ref([]);
const productosAdmin = ref([]);
const solicitudesProducto = ref([]);
const kpis = ref({});
const mensaje = ref('');
const procesando = ref(false);
const subiendoImagenProducto = ref(false);
const busquedaClientes = ref('');

const adminHeaders = computed(() => ({
  headers: {
    'x-user-role': 'admin',
    'x-user-id': currentUser.value?.id || ''
  }
}));

const usuarioForm = ref({
  nombre: '',
  correo: '',
  password: '',
  rol: 'vendedor'
});

const productoForm = ref({
  id_producto: null,
  id_categoria: 0,
  codigo_sku: '',
  nombre: '',
  precio_unitario: 0,
  stock_actual: 0,
  ficha_tecnica: '',
  url_galeria: ''
});

const pendientes = computed(() => solicitudes.value.filter((item) => item.estado === 'PENDIENTE'));
const totalVentas = computed(() => ordenes.value.reduce((total, orden) => total + Number(orden.total_con_iva || 0), 0));
const imagenProductoPreview = computed(() => resolveAssetUrl(productoForm.value.url_galeria));
const clientesFiltrados = computed(() => {
  const texto = busquedaClientes.value.toLowerCase();
  if (!texto) return clientes.value;

  return clientes.value.filter((cliente) => [
    cliente.nombre_completo,
    cliente.correo,
    cliente.nit,
    cliente.direccion_envio,
    cliente.id_cliente
  ].filter(Boolean).join(' ').toLowerCase().includes(texto));
});

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

const iniciales = (nombre) => String(nombre || '')
  .split(' ')
  .filter(Boolean)
  .slice(0, 2)
  .map((parte) => parte[0])
  .join('')
  .toUpperCase() || 'CL';

const limpiarProductoForm = () => {
  productoForm.value = {
    id_producto: null,
    id_categoria: 0,
    codigo_sku: '',
    nombre: '',
    precio_unitario: 0,
    stock_actual: 0,
    ficha_tecnica: '',
    url_galeria: ''
  };
};

const normalizarProductoAdmin = (producto) => ({
  id_producto: producto.id_producto,
  id_categoria: producto.id_categoria,
  codigo_sku: producto.codigo_sku || '',
  nombre: producto.nombre || '',
  precio_unitario: Number(producto.precio_unitario || producto.precio || 0),
  stock_actual: Number(producto.stock_actual || producto.stock || 0),
  ficha_tecnica: producto.ficha_tecnica || '',
  url_galeria: producto.url_galeria || producto.imagen || '',
  imagen_resuelta: resolveAssetUrl(producto.url_galeria || producto.imagen),
  categoria: producto.categoria || ''
});

const cargarTodo = async () => {
  if (!isAdmin.value) return;
  mensaje.value = '';

  try {
    const [solicitudesRes, ordenesRes] = await Promise.all([
      api.get('/admin/solicitudes', adminHeaders.value),
      api.get('/admin/ordenes', adminHeaders.value)
    ]);
    const [usuariosRes, clientesRes, kpisRes, categoriasRes, solicitudesProductoRes, productosRes] = await Promise.all([
      api.get('/admin/usuarios', adminHeaders.value),
      api.get('/admin/clientes', adminHeaders.value),
      api.get('/admin/kpis', adminHeaders.value),
      api.get('/categorias'),
      api.get('/staff/solicitudes-producto', adminHeaders.value),
      api.get('/admin/productos', adminHeaders.value)
    ]);

    solicitudes.value = solicitudesRes.data;
    ordenes.value = ordenesRes.data;
    usuarios.value = usuariosRes.data;
    clientes.value = clientesRes.data;
    kpis.value = kpisRes.data;
    categorias.value = categoriasRes.data;
    solicitudesProducto.value = solicitudesProductoRes.data;
    productosAdmin.value = productosRes.data.map(normalizarProductoAdmin);
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo cargar el panel admin.';
  }
};

const validarSolicitud = async (id, action) => {
  procesando.value = true;
  mensaje.value = '';

  try {
    const response = await api.patch(`/admin/solicitudes/${id}`, { action }, adminHeaders.value);
    mensaje.value = response.data.mensaje;
    await cargarTodo();
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo validar la solicitud.';
  } finally {
    procesando.value = false;
  }
};

const crearUsuario = async () => {
  procesando.value = true;
  mensaje.value = '';

  try {
    const response = await api.post('/admin/usuarios', usuarioForm.value, adminHeaders.value);
    mensaje.value = response.data.mensaje;
    usuarioForm.value = { nombre: '', correo: '', password: '', rol: 'vendedor' };
    await cargarTodo();
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo crear el usuario.';
  } finally {
    procesando.value = false;
  }
};

const actualizarUsuario = async (idUsuario, payload) => {
  try {
    const response = await api.patch(`/admin/usuarios/${idUsuario}`, payload, adminHeaders.value);
    mensaje.value = response.data.mensaje;
    await cargarTodo();
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo actualizar el usuario.';
  }
};

const guardarUsuario = async (usuario) => {
  const payload = {
    nombre: usuario.nombre,
    correo: usuario.correo,
    nit: usuario.nit,
    telefono: usuario.telefono,
    rol: usuario.rol,
    estado: usuario.estado
  };

  if (usuario.password_temp) {
    payload.password = usuario.password_temp;
  }

  await actualizarUsuario(usuario.id, payload);
};

const eliminarUsuario = async (idUsuario) => {
  try {
    const response = await api.delete(`/admin/usuarios/${idUsuario}`, adminHeaders.value);
    mensaje.value = response.data.mensaje;
    await cargarTodo();
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo eliminar el usuario.';
  }
};

const actualizarEstado = async (idOrden, estado) => {
  try {
    await api.patch(`/admin/ordenes/${idOrden}`, { estado }, adminHeaders.value);
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
      headers: adminHeaders.value.headers
    });
    productoForm.value.url_galeria = response.data.data.url;
    if (productoForm.value.id_producto) {
      await api.put(`/admin/productos/${productoForm.value.id_producto}`, productoForm.value, adminHeaders.value);
      mensaje.value = 'Imagen cargada y producto actualizado.';
      await cargarTodo();
    } else {
      mensaje.value = response.data.mensaje;
    }
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo cargar la imagen.';
  } finally {
    subiendoImagenProducto.value = false;
    event.target.value = '';
  }
};

const editarProducto = (producto) => {
  productoForm.value = {
    id_producto: producto.id_producto,
    id_categoria: Number(producto.id_categoria || 0),
    codigo_sku: producto.codigo_sku || '',
    nombre: producto.nombre || '',
    precio_unitario: Number(producto.precio_unitario || 0),
    stock_actual: Number(producto.stock_actual || 0),
    ficha_tecnica: producto.ficha_tecnica || '',
    url_galeria: producto.url_galeria || ''
  };
  tab.value = 'productos';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

const crearProducto = async () => {
  procesando.value = true;
  mensaje.value = '';

  try {
    const response = productoForm.value.id_producto
      ? await api.put(`/admin/productos/${productoForm.value.id_producto}`, productoForm.value, adminHeaders.value)
      : await api.post('/staff/productos', productoForm.value, adminHeaders.value);
    mensaje.value = response.data.mensaje;
    limpiarProductoForm();
    await cargarTodo();
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo publicar el producto.';
  } finally {
    procesando.value = false;
  }
};

const eliminarProducto = async (idProducto) => {
  if (!window.confirm('Eliminar este producto del catalogo?')) return;

  procesando.value = true;
  mensaje.value = '';

  try {
    const response = await api.delete(`/admin/productos/${idProducto}`, adminHeaders.value);
    mensaje.value = response.data.mensaje;
    await cargarTodo();
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo eliminar el producto.';
  } finally {
    procesando.value = false;
  }
};

const resolverSolicitudProducto = async (idSolicitud, action) => {
  procesando.value = true;
  mensaje.value = '';

  try {
    const response = await api.patch(`/admin/solicitudes-producto/${idSolicitud}`, { action }, adminHeaders.value);
    mensaje.value = response.data.mensaje;
    await cargarTodo();
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo procesar la solicitud de producto.';
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
.admin-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.admin-header,
.panel-heading,
.order-main,
.order-footer,
.request-card,
.user-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.admin-header {
  align-items: flex-end;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--line);
}

.eyebrow,
.metric-grid span,
.order-main span,
.state {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.admin-header h1 {
  margin: 8px 0;
  color: var(--ink);
  font-size: clamp(2rem, 5vw, 3.5rem);
  line-height: 1;
}

.admin-header p,
.request-card p,
.request-card small,
.user-card p,
.user-card small,
.client-card p,
.client-card small,
.product-request p,
.product-request small,
.order-main p,
.order-footer,
.message,
.feedback,
.empty-state p {
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

button:disabled {
  background: #c9d0d6;
  color: #59636d;
  cursor: not-allowed;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 14px;
}

.metric-grid article,
.panel,
.request-card,
.user-card,
.client-card,
.product-request,
.order-card,
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
  font-size: 2rem;
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
  margin-bottom: 4px;
}

.panel-heading h2,
.request-card h3,
.user-card h3,
.client-card h3,
.order-main h3 {
  margin: 6px 0;
  color: var(--ink);
}

.request-card,
.user-card,
.client-card,
.product-request,
.order-card {
  padding: 18px;
}

.request-card,
.user-card,
.product-request {
  align-items: center;
}

.portal-user-card {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.user-profile {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  gap: 16px;
  align-items: center;
  border-bottom: 1px solid var(--line);
  background:
    linear-gradient(135deg, rgba(31, 105, 161, 0.09), rgba(46, 125, 50, 0.04)),
    #fbfdff;
  padding: 20px 22px;
}

.user-avatar {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, var(--ink), var(--accent));
  color: white;
  font-weight: 900;
  font-size: 1.05rem;
  box-shadow: 0 14px 24px rgba(24, 39, 75, 0.16);
}

.user-profile h3 {
  margin: 7px 0 5px;
  color: var(--ink);
  font-size: 1.22rem;
  line-height: 1.2;
}

.user-profile p,
.user-profile small {
  margin: 0;
  color: var(--muted);
  overflow-wrap: anywhere;
}

.user-profile small {
  display: block;
  margin-top: 10px;
  font-weight: 800;
  text-transform: capitalize;
}

.user-profile::after {
  content: "Usuario interno";
  justify-self: end;
  border: 1px solid rgba(31, 105, 161, 0.16);
  border-radius: 999px;
  background: white;
  color: var(--accent-strong);
  padding: 8px 12px;
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.actions .danger {
  background: #8c1d18;
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

.order-card {
  display: grid;
  gap: 14px;
}

.order-main {
  align-items: flex-start;
}

.order-main strong {
  color: var(--ink);
  font-size: 1.35rem;
}

.order-footer {
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--line);
}

select {
  height: 38px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  padding: 0 10px;
  font: inherit;
  font-weight: 800;
}

.user-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  min-width: 0;
}

.user-editor {
  align-self: start;
  min-width: 0;
  padding: 22px;
  background: white;
}

.user-actions label {
  display: grid;
  gap: 8px;
}

.user-actions label span,
.client-card span,
.client-card small,
.client-toolbar label span,
.client-toolbar small {
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.user-actions input {
  height: 44px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  padding: 0 12px;
  font: inherit;
}

.user-actions select {
  height: 44px;
}

.user-actions input:disabled,
.user-actions select:disabled {
  background: #eef3f7;
  color: #7a8792;
}

.user-card-footer {
  grid-column: 1;
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(220px, 1fr) auto;
  gap: 16px;
  align-items: center;
  margin: 0 22px 22px;
  border-top: 1px solid var(--line);
  background: #fbfdff;
  border-radius: 8px;
  padding: 16px;
}

.user-card-footer span {
  display: block;
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.user-card-footer strong {
  display: block;
  margin-top: 5px;
  color: var(--ink);
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}

.user-card-buttons {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.user-card-buttons button {
  min-width: 112px;
}

.client-card strong,
.client-toolbar strong {
  display: block;
  color: var(--ink);
}

.client-toolbar {
  display: grid;
  grid-template-columns: minmax(220px, 1fr) 150px;
  gap: 14px;
  align-items: end;
  border: 1px solid rgba(31, 105, 161, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(31, 105, 161, 0.07), rgba(46, 125, 50, 0.05)),
    #fff;
  padding: 16px;
}

.client-toolbar label {
  display: grid;
  gap: 8px;
}

.client-toolbar input {
  width: 100%;
  height: 42px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  padding: 0 12px;
  font: inherit;
}

.client-toolbar > div {
  border-left: 1px solid var(--line);
  padding-left: 14px;
}

.client-toolbar strong {
  margin-top: 5px;
  font-size: 1.7rem;
}

.client-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(310px, 1fr));
  gap: 14px;
}

.client-card {
  display: grid;
  gap: 16px;
  overflow: hidden;
  padding: 18px;
  transition: transform 0.2s ease, border-color 0.2s ease;
}

.client-card:hover {
  transform: translateY(-2px);
  border-color: rgba(31, 105, 161, 0.34);
}

.client-main {
  display: grid;
  grid-template-columns: 54px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
}

.client-avatar {
  display: grid;
  place-items: center;
  width: 54px;
  height: 54px;
  border-radius: 14px;
  background:
    linear-gradient(135deg, var(--ink), var(--accent));
  color: white;
  font-weight: 900;
}

.client-main h3 {
  margin: 5px 0;
  color: var(--ink);
}

.client-main p,
.client-address p {
  margin: 0;
  overflow-wrap: anywhere;
}

.client-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.client-meta div,
.client-address {
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f8fbfd;
  padding: 12px;
}

.client-meta strong {
  margin-top: 5px;
  font-size: 0.95rem;
}

.inline-form,
.product-form {
  display: grid;
  gap: 12px;
  border: 1px solid rgba(31, 105, 161, 0.16);
  border-radius: 8px;
  background:
    linear-gradient(135deg, rgba(31, 105, 161, 0.07), rgba(46, 125, 50, 0.05)),
    #fff;
  padding: 16px;
}

.inline-form {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.product-form {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.inline-form input,
.inline-form select,
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

.inline-form input,
.inline-form select,
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

.form-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

button.ghost {
  border: 1px solid var(--line);
  background: white;
  color: var(--ink);
}

.product-form textarea {
  padding-block: 10px;
  resize: vertical;
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

.full-field {
  grid-column: 1 / -1;
}

.subheading {
  padding-top: 8px;
}

.subheading h3,
.product-request h3 {
  margin: 6px 0;
  color: var(--ink);
}

.admin-product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
  gap: 14px;
}

.admin-product-card {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 14px;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
  padding: 14px;
  box-shadow: var(--shadow-soft);
}

.admin-product-thumb {
  display: grid;
  place-items: center;
  width: 92px;
  height: 92px;
  border-radius: 8px;
  background: #eef3f7;
  padding: 10px;
}

.admin-product-thumb img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.admin-product-thumb span {
  color: var(--ink);
  font-weight: 900;
}

.admin-product-card small,
.admin-product-card p,
.admin-product-card em {
  color: var(--muted);
}

.admin-product-card h3 {
  margin: 4px 0;
  color: var(--ink);
}

.admin-product-card p {
  margin: 0 0 6px;
}

.admin-product-card strong,
.admin-product-card em {
  display: block;
}

.admin-product-card strong {
  color: var(--ink);
  font-size: 1.1rem;
}

.admin-product-card em {
  margin-top: 2px;
  font-style: normal;
  font-weight: 800;
}

.admin-product-card .actions {
  grid-column: 1 / -1;
}

.product-request {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 140px auto;
  gap: 16px;
}

.product-request strong {
  display: block;
  color: var(--ink);
  font-size: 1.25rem;
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
  .admin-header,
  .request-card,
  .user-card,
  .product-request,
  .order-main,
  .order-footer {
    display: grid;
    grid-template-columns: 1fr;
  }

  .metric-grid,
  .user-actions,
  .inline-form,
  .product-form,
  .client-toolbar,
  .client-meta {
    grid-template-columns: 1fr;
  }

  .client-toolbar > div {
    border-left: 0;
    border-top: 1px solid var(--line);
    padding-top: 12px;
    padding-left: 0;
  }

  .portal-user-card,
  .user-profile,
  .user-card-footer {
    grid-template-columns: 1fr;
  }

  .user-profile {
    border-bottom: 1px solid var(--line);
  }

  .user-profile::after {
    justify-self: start;
  }

  .user-editor,
  .user-card-footer {
    grid-column: 1;
  }

  .user-card-footer {
    margin-inline: 18px;
  }

  .user-card-buttons {
    justify-content: stretch;
  }

  .user-card-buttons button {
    flex: 1;
  }
}
</style>
