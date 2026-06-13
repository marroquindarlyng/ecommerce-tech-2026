import { computed, ref } from 'vue';
import api from '../services/api';

const STORAGE_KEY = 'tech2026_session';

const readSession = () => {
  if (typeof window === 'undefined') return null;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
};

const currentUser = ref(readSession());

const persist = () => {
  if (typeof window === 'undefined') return;

  if (currentUser.value) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser.value));
  } else {
    window.localStorage.removeItem(STORAGE_KEY);
  }
};

const login = async ({ correo, password }) => {
  const response = await api.post('/auth/login', { correo, password });
  currentUser.value = response.data.data;
  persist();
  return currentUser.value;
};

const register = async (payload) => {
  const response = await api.post('/auth/register', payload);
  return response.data;
};

const logout = () => {
  currentUser.value = null;
  persist();
};

export const useSession = () => ({
  currentUser,
  isLoggedIn: computed(() => Boolean(currentUser.value)),
  isAdmin: computed(() => currentUser.value?.rol === 'admin'),
  isVendor: computed(() => currentUser.value?.rol === 'vendedor'),
  isStaff: computed(() => ['admin', 'vendedor'].includes(currentUser.value?.rol)),
  isCustomer: computed(() => currentUser.value?.rol === 'cliente'),
  login,
  register,
  logout
});
