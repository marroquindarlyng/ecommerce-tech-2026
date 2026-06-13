<template>
  <div class="app-wrapper">
    <header class="site-header">
      <div class="utility-bar">
        <span>Entrega en Guatemala</span>
        <span>Soporte local</span>
        <span>Pagos con VisaCuotas</span>
      </div>

      <div class="navbar">
        <router-link to="/" class="brand">
          <span class="brand-mark">T</span>
          <span>Tech2026</span>
        </router-link>

        <nav class="nav-links" aria-label="Navegacion principal">
          <router-link to="/">Inicio</router-link>
          <router-link to="/catalogo">Catalogo</router-link>
          <router-link to="/cotizador">Cotizador</router-link>
          <router-link v-if="isAdmin" to="/admin">Admin</router-link>
          <router-link v-else-if="isVendor" to="/vendedor">Vendedor</router-link>
          <router-link v-else to="/mi-cuenta">Mi cuenta</router-link>
          <router-link to="/carrito" class="cart-nav">
            Carrito
            <span v-if="totalItems > 0" class="cart-count">{{ totalItems }}</span>
          </router-link>
          <button v-if="isLoggedIn" type="button" class="session-button" @click="logout">Salir</button>
          <router-link v-else to="/login">Ingresar</router-link>
        </nav>
      </div>
    </header>

    <main class="main-content">
      <router-view></router-view>
    </main>

    <footer class="footer">
      <section>
        <strong>Tech2026</strong>
        <p>Tecnologia lista para trabajar, jugar y crear, con compra rapida y soporte local.</p>
      </section>
      <section>
        <strong>Compra</strong>
        <RouterLink to="/catalogo">Catalogo</RouterLink>
        <RouterLink to="/carrito">Carrito</RouterLink>
        <RouterLink to="/pago">Checkout</RouterLink>
      </section>
      <section>
        <strong>Cuenta</strong>
        <RouterLink to="/login">Ingresar</RouterLink>
        <RouterLink to="/mi-cuenta">Mis ordenes</RouterLink>
      </section>
      <section>
        <strong>Soporte</strong>
        <span>Atencion por WhatsApp</span>
        <span>Horario: Lun-Sab</span>
      </section>
    </footer>
  </div>
</template>

<script setup>
import { useCart } from './stores/cart';
import { useSession } from './stores/session';

const { totalItems } = useCart();
const { isLoggedIn, isAdmin, isVendor, logout } = useSession();
</script>

<style>
:root {
  --bg: #eef3f7;
  --surface: #ffffff;
  --ink: #17212b;
  --muted: #6b7682;
  --accent: #1f69a1;
  --accent-strong: #164d78;
  --success: #2e7d32;
  --warning: #b65d13;
  --line: #dfe5ea;
  --shadow-soft: 0 14px 32px rgba(24, 39, 75, 0.08);
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  margin: 0;
  background:
    linear-gradient(180deg, rgba(31, 105, 161, 0.08), transparent 340px),
    linear-gradient(90deg, rgba(23, 33, 43, 0.04) 1px, transparent 1px),
    linear-gradient(180deg, rgba(23, 33, 43, 0.04) 1px, transparent 1px),
    var(--bg);
  background-size: auto, 42px 42px, 42px 42px, auto;
  color: var(--ink);
  font-family: Inter, "Segoe UI", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  text-rendering: optimizeLegibility;
}

a {
  color: inherit;
}

.app-wrapper {
  display: flex;
  min-height: 100vh;
  flex-direction: column;
}

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid rgba(223, 229, 234, 0.9);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 12px 30px rgba(24, 39, 75, 0.08);
  backdrop-filter: blur(14px);
}

.utility-bar {
  display: flex;
  justify-content: center;
  gap: clamp(12px, 4vw, 36px);
  padding: 8px clamp(16px, 4vw, 48px);
  background:
    linear-gradient(90deg, #17212b, #12344d 55%, #1f3f2b);
  color: rgba(255, 255, 255, 0.82);
  font-size: 0.78rem;
  font-weight: 800;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 14px clamp(16px, 4vw, 48px);
}

.brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--ink);
  font-size: 1rem;
  font-weight: 900;
  text-decoration: none;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--ink), var(--accent));
  color: white;
  font-weight: 900;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
}

.nav-links::-webkit-scrollbar {
  display: none;
}

.nav-links a {
  flex: 0 0 auto;
  border-radius: 999px;
  color: var(--muted);
  padding: 9px 13px;
  text-decoration: none;
  font-size: 0.92rem;
  font-weight: 800;
  transition: background 0.2s ease, color 0.2s ease;
}

.session-button {
  flex: 0 0 auto;
  border: 0;
  border-radius: 999px;
  background: #eef3f7;
  color: var(--ink);
  padding: 9px 13px;
  font: inherit;
  font-size: 0.92rem;
  font-weight: 800;
  cursor: pointer;
}

.nav-links a:hover,
.nav-links a.router-link-active,
.session-button:hover {
  background: #e6f1f8;
  color: var(--accent-strong);
}

.cart-nav {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.cart-count {
  display: grid;
  place-items: center;
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--ink);
  color: white;
  padding: 0 7px;
  font-size: 0.75rem;
  line-height: 1;
}

.main-content {
  width: min(100%, 1440px);
  flex: 1;
  margin: 0 auto;
  padding: clamp(18px, 4vw, 48px);
}

.footer {
  display: grid;
  grid-template-columns: 1.4fr repeat(3, 1fr);
  gap: 24px;
  padding: 28px clamp(16px, 4vw, 48px);
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.86rem;
  background:
    linear-gradient(180deg, #fff, #f8fbfd);
}

.footer section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.footer strong {
  color: var(--ink);
}

.footer p {
  max-width: 420px;
  margin: 0;
  line-height: 1.55;
}

.footer a {
  color: var(--muted);
  text-decoration: none;
}

.footer a:hover {
  color: var(--accent);
}

@media (max-width: 720px) {
  .navbar {
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
  }

  .nav-links {
    width: 100%;
  }

  .nav-links a {
    padding-inline: 12px;
  }

  .utility-bar {
    justify-content: flex-start;
    overflow-x: auto;
    white-space: nowrap;
  }

  .footer {
    grid-template-columns: 1fr;
  }
}
</style>
