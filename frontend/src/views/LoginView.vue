<template>
  <section class="account-page">
    <header class="account-header">
      <span class="eyebrow">Cuenta</span>
      <h1>Ingresa o solicita acceso</h1>
      <p>Compra como invitado cuando quieras, o crea una cuenta para consultar tus ordenes aprobadas.</p>
    </header>

    <div class="account-shell">
      <section class="auth-card">
        <div class="tabs" role="tablist" aria-label="Acceso">
          <button type="button" :class="{ active: modo === 'login' }" @click="modo = 'login'">Ingresar</button>
          <button type="button" :class="{ active: modo === 'registro' }" @click="modo = 'registro'">Crear usuario</button>
        </div>

        <form v-if="modo === 'login'" class="form-stack" @submit.prevent="hacerLogin">
          <label>
            <span>Correo</span>
            <input v-model.trim="loginForm.correo" required type="email" placeholder="correo@dominio.com">
          </label>
          <label>
            <span>Contrasena</span>
            <input v-model="loginForm.password" required type="password" placeholder="Tu contrasena">
          </label>
          <button type="submit" :disabled="procesando">
            {{ procesando ? 'Validando...' : 'Ingresar' }}
          </button>
        </form>

        <form v-else class="form-stack" @submit.prevent="crearSolicitud">
          <label>
            <span>Nombre completo</span>
            <input v-model.trim="registro.nombre" required type="text" placeholder="Nombre y apellido">
          </label>
          <label>
            <span>Correo</span>
            <input v-model.trim="registro.correo" required type="email" placeholder="correo@dominio.com">
          </label>
          <label>
            <span>Contrasena</span>
            <input v-model="registro.password" required minlength="6" type="password" placeholder="Minimo 6 caracteres">
          </label>
          <div class="field-grid">
            <label>
              <span>NIT</span>
              <input v-model.trim="registro.nit" type="text" placeholder="CF">
            </label>
            <label>
              <span>Telefono</span>
              <input v-model.trim="registro.telefono" type="tel" placeholder="+502 0000-0000">
            </label>
          </div>
          <label>
            <span>Direccion</span>
            <textarea v-model.trim="registro.direccion_envio" rows="3" placeholder="Direccion principal de entrega"></textarea>
          </label>
          <button type="submit" :disabled="procesando">
            {{ procesando ? 'Enviando...' : 'Enviar solicitud' }}
          </button>
        </form>

        <p v-if="mensaje" class="message" :class="{ ok: mensajeOk }">{{ mensaje }}</p>
      </section>

      <aside class="info-panel">
        <span>Cuenta Tech2026</span>
        <strong>Compra con seguimiento completo</strong>
        <p>Accede a tu historial, consulta el estado de tus pedidos y guarda tus datos de entrega para futuras compras.</p>
        <div>
          <small>Solicitudes de acceso</small>
          <p>Las cuentas nuevas pasan por una validacion interna para proteger compras, pedidos y datos de clientes.</p>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useSession } from '../stores/session';

const router = useRouter();
const { login, register } = useSession();
const modo = ref('login');
const procesando = ref(false);
const mensaje = ref('');
const mensajeOk = ref(false);

const loginForm = reactive({
  correo: '',
  password: ''
});

const registro = reactive({
  nombre: '',
  correo: '',
  password: '',
  nit: 'CF',
  telefono: '',
  direccion_envio: ''
});

const hacerLogin = async () => {
  procesando.value = true;
  mensaje.value = '';
  mensajeOk.value = false;

  try {
    const user = await login(loginForm);
    if (user.rol === 'admin') {
      router.push('/admin');
    } else if (user.rol === 'vendedor') {
      router.push('/vendedor');
    } else {
      router.push('/mi-cuenta');
    }
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo iniciar sesion.';
  } finally {
    procesando.value = false;
  }
};

const crearSolicitud = async () => {
  procesando.value = true;
  mensaje.value = '';
  mensajeOk.value = false;

  try {
    const response = await register(registro);
    mensaje.value = response.mensaje;
    mensajeOk.value = true;
    modo.value = 'login';
    registro.password = '';
  } catch (err) {
    mensaje.value = err.response?.data?.mensaje || 'No se pudo crear la solicitud.';
  } finally {
    procesando.value = false;
  }
};
</script>

<style scoped>
.account-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.account-header {
  max-width: 760px;
}

.eyebrow,
.info-panel span,
label span {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 900;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.account-header h1 {
  margin: 8px 0 10px;
  color: var(--ink);
  font-size: clamp(2.2rem, 5vw, 4rem);
  line-height: 1;
}

.account-header p,
.info-panel p,
.message {
  color: var(--muted);
  line-height: 1.55;
}

.account-shell {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, 380px);
  gap: 24px;
  align-items: start;
}

.auth-card,
.info-panel {
  border: 1px solid var(--line);
  background: var(--surface);
  border-radius: 8px;
  box-shadow: var(--shadow-soft);
}

.auth-card {
  padding: 24px;
}

.tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 20px;
  padding: 6px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: #f7fafc;
}

.tabs button,
.form-stack button {
  min-height: 44px;
  border: 0;
  border-radius: 6px;
  font: inherit;
  font-weight: 900;
  cursor: pointer;
}

.tabs button {
  background: transparent;
  color: var(--muted);
}

.tabs button.active,
.form-stack button {
  background: var(--ink);
  color: white;
}

.form-stack {
  display: grid;
  gap: 14px;
}

.field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

label {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

input,
textarea {
  width: 100%;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: white;
  color: var(--ink);
  padding: 0 12px;
  font: inherit;
}

input {
  height: 44px;
}

textarea {
  padding-block: 10px;
  resize: vertical;
}

.form-stack button:disabled {
  background: #c9d0d6;
  color: #59636d;
  cursor: not-allowed;
}

.message {
  margin: 16px 0 0;
}

.message.ok {
  color: #2e7d32;
  font-weight: 800;
}

.info-panel {
  display: grid;
  gap: 12px;
  padding: 24px;
  background: var(--ink);
  color: white;
}

.info-panel span,
.info-panel p,
.info-panel small {
  color: rgba(255, 255, 255, 0.72);
}

.info-panel strong {
  color: white;
  font-size: 1.15rem;
}

.info-panel div {
  padding-top: 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.16);
}

@media (max-width: 820px) {
  .account-shell,
  .field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
