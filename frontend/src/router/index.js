import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import CatalogoView from '../views/CatalogoView.vue';
import CotizadorView from '../views/CotizadorView.vue';
import CarritoView from '../views/CarritoView.vue';
import ProductoDetalleView from '../views/ProductoDetalleView.vue'; // Nueva importación

const routes = [
  { path: '/', name: 'Inicio', component: HomeView },
  { path: '/catalogo', name: 'Catalogo', component: CatalogoView },
  { path: '/producto/:id', name: 'ProductoDetalle', component: ProductoDetalleView }, // Ruta dinámica
  { path: '/cotizador', name: 'Cotizador', component: CotizadorView },
  { path: '/carrito', name: 'Carrito', component: CarritoView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;