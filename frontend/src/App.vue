<template>
  <div class="app-wrapper">
    <header class="navbar">
      <router-link to="/" class="brand">
        <span class="brand-mark">T</span>
        <span>Tech2026</span>
      </router-link>

      <nav class="nav-links" aria-label="Navegacion principal">
        <router-link to="/">Inicio</router-link>
        <router-link to="/catalogo">Catalogo</router-link>
        <router-link to="/cotizador">Cotizador</router-link>
        <router-link to="/carrito">Carrito</router-link>
      </nav>
    </header>

    <main class="main-content">
      <router-view></router-view>
    </main>

    <footer class="footer">
      <span>Ecommerce Tech 2026</span>
      <span>Proyecto Fase 1</span>
    </footer>
  </div>
</template>

<style>
:root {
  --bg: #f4f6f8;
  --surface: #ffffff;
  --ink: #17212b;
  --muted: #6b7682;
  --accent: #1f69a1;
  --accent-strong: #164d78;
  --line: #dfe5ea;
  --shadow-soft: 0 10px 24px rgba(24, 39, 75, 0.06);
}

* {
  box-sizing: border-box;
}

body {
  min-width: 320px;
  margin: 0;
  background: var(--bg);
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

.navbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  padding: 14px clamp(16px, 4vw, 48px);
  border-bottom: 1px solid rgba(223, 229, 234, 0.9);
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 8px 24px rgba(24, 39, 75, 0.05);
  backdrop-filter: blur(14px);
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
  background: var(--ink);
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

.nav-links a:hover,
.nav-links a.router-link-active {
  background: #e8f0f7;
  color: var(--accent-strong);
}

.main-content {
  width: min(100%, 1440px);
  flex: 1;
  margin: 0 auto;
  padding: clamp(18px, 4vw, 48px);
}

.footer {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px clamp(16px, 4vw, 48px);
  border-top: 1px solid var(--line);
  color: var(--muted);
  font-size: 0.86rem;
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

  .footer {
    flex-direction: column;
  }
}
</style>
