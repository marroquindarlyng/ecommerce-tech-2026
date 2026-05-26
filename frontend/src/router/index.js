import { createRouter, createWebHistory } from 'vue-router';

// Importación de las vistas (las crearemos en el siguiente paso)
import HomeView from '../views/HomeView.vue';
import CatalogoView from '../views/CatalogoView.vue';
import CarritoView from '../views/CarritoView.vue';

const routes = [
  { path: '/', name: 'Inicio', component: HomeView },
  { path: '/catalogo', name: 'Catalogo', component: CatalogoView },
  { path: '/carrito', name: 'Carrito', component: CarritoView }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;