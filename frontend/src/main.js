import { createApp } from 'vue';
import App from './App.vue';
import router from './router'; // Importamos la configuración del router

const app = createApp(App);

app.use(router); // Inyectamos el router en la instancia
app.mount('#app');