<template>
  <div class="app-wrapper">
    <header class="navbar">
      <div class="logo">💻 Tech2026</div>
      <nav class="nav-links">
        <router-link to="/">Inicio</router-link>
        <router-link to="/catalogo">Catálogo</router-link>
        <router-link to="/cotizador">Cotizador</router-link>
        <router-link to="/carrito" class="nav-carrito">
          <span class="icon-cart">🛒</span> Carrito
        </router-link>
      </nav>
    </header>

    <main class="main-content">
      <router-view></router-view>
    </main>

    <footer class="footer">
      <p>Copyright © 2026 Ecommerce Tech - Proyecto Fase 1</p>
    </footer>
  </div>
</template>

<style>
/* --- Estilos Globales: Paleta Minimalista y Tipografía Refinada --- */
body {
  margin: 0;
  font-family: 'Inter', 'Segoe UI', Helvetica, sans-serif; /* Fuente contemporánea */
  background-color: #F7F7F7; /* Chalk-White profundo */
  color: #1E1E1E; /* Charcoal profundo */
  -webkit-font-smoothing: antialiased;
}

.app-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* Navbar: Sólida, Sobria y Limpia */
.navbar {
  background-color: #1E1E1E; /* Charcoal sólido */
  color: #F7F7F7;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 50px; /* Mayor espacio lateral */
  border-bottom: 1px solid rgba(255,255,255,0.05); /* Línea divisoria muy sutil */
}

.logo {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: -0.5px; /* Detalle contemporáneo */
}

.nav-links {
  display: flex;
  align-items: center;
}

.nav-links a {
  color: #8C8C8C; /* Gris frío apagado */
  text-decoration: none;
  margin-left: 35px;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.3s ease; /* Transición suave */
}

.nav-links a:hover,
.nav-links a.router-link-active {
  color: #F7F7F7; /* Blanco tiza al activar */
}

.nav-carrito {
  display: flex;
  align-items: center;
}

.icon-cart {
  margin-right: 8px;
  font-size: 1.1rem;
}

/* Contenedor Principal: Respirable */
.main-content {
  flex: 1;
  padding: 50px; /* Generoso espacio alrededor */
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

/* Footer: Minimalista */
.footer {
  background-color: #1E1E1E;
  color: #8C8C8C;
  text-align: center;
  padding: 20px;
  font-size: 0.85rem;
  font-weight: 400;
  border-top: 1px solid rgba(255,255,255,0.05);
}

/* --- Ajuste para el Módulo de Catálogo y Carrito: Tarjetas y Grid Contemporáneos --- */
/* Nota: Deberás aplicar estilos similares en CatalogoView.vue y CarritoView.vue */
.catalogo-title, .carrito-title {
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 40px;
  letter-spacing: -1px;
}

.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 30px;
}

.product-card {
  background: white;
  border: 1px solid #EEEEEE;
  border-radius: 4px; /* Bordes más limpios y menos redondeados */
  overflow: hidden;
  transition: box-shadow 0.3s ease, transform 0.3s ease;
}

.product-card:hover {
  box-shadow: 0 10px 20px rgba(0,0,0,0.03); /* Sombra muy sutil */
  transform: translateY(-2px);
}

.product-image {
  background-color: #F2F2F2;
  height: 250px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #8C8C8C;
}

.product-details {
  padding: 20px;
}

.product-details h3 {
  font-size: 1rem;
  margin: 0 0 10px 0;
  color: #1E1E1E;
}

.product-price {
  font-size: 1.25rem;
  font-weight: 600;
  color: #2E7D32; /* Verde apagado sofisticado */
}

.product-btn {
  background-color: #1E1E1E;
  color: white;
  border: none;
  padding: 12px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
  width: 100%;
  margin-top: 15px;
  transition: background-color 0.3s ease;
}

.product-btn:hover {
  background-color: #333333;
}
</style>