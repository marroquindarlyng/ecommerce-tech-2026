<template>
  <div class="app-wrapper">
    <header class="navbar">
      <div class="logo">💻 Tech2026</div>
      <nav class="nav-links">
        <router-link to="/">Inicio</router-link>
        <router-link to="/catalogo">Catálogo</router-link>
        <router-link to="/carrito">Carrito</router-link>
      </nav>
    </header>

    <main class="main-content">
      <router-view></router-view>
    </main>

    <footer class="footer">
      <p>© 2026 Ecommerce Tech - Proyecto Fase 1</p>
    </footer>
  </div>
</template>

<style>
/* Estilos Globales del Layout */
body { margin: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8f9fa; color: #333; }
.app-wrapper { display: flex; flex-direction: column; min-height: 100vh; }

.navbar { background-color: #212529; color: white; display: flex; justify-content: space-between; align-items: center; padding: 15px 30px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.logo { font-size: 1.5rem; font-weight: bold; }
.nav-links a { color: #adb5bd; text-decoration: none; margin-left: 20px; font-weight: 500; transition: color 0.3s; }
.nav-links a:hover, .nav-links a.router-link-active { color: white; }

.main-content { flex: 1; padding: 20px; }

.footer { background-color: #e9ecef; text-align: center; padding: 15px; font-size: 0.9rem; color: #6c757d; border-top: 1px solid #dee2e6; }
</style>