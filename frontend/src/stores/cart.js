import { computed, ref } from 'vue';
import { resolveAssetUrl } from '../services/assets';

const STORAGE_KEY = 'tech2026_cart';

const readCart = () => {
  if (typeof window === 'undefined') return [];

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
};

const items = ref(readCart());

const saveCart = () => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items.value));
};

const clampQuantity = (quantity, stock) => {
  const safeStock = Number(stock || 0);
  const safeQuantity = Number(quantity || 1);
  return Math.min(Math.max(safeQuantity, 1), safeStock);
};

const normalizeCartProduct = (product) => ({
  id_producto: Number(product.id_producto),
  id_categoria: product.id_categoria || null,
  codigo_sku: product.codigo_sku || null,
  nombre: product.nombre || 'Producto sin nombre',
  precio: Number(product.precio || product.precio_unitario || product.precio_total || 0),
  stock: Number(product.stock || product.stock_actual || 0),
  ficha_tecnica: product.ficha_tecnica || null,
  imagen: resolveAssetUrl(product.imagen || product.url_galeria || null),
  categoria: product.categoria || null
});

const addToCart = (product, quantity = 1) => {
  const normalized = normalizeCartProduct(product);

  if (!normalized.id_producto || normalized.stock <= 0) {
    return { ok: false, message: 'Este producto no tiene stock disponible.' };
  }

  const existing = items.value.find((item) => item.id_producto === normalized.id_producto);

  if (existing) {
    const nextQuantity = clampQuantity(existing.cantidad + quantity, normalized.stock);
    existing.cantidad = nextQuantity;
    existing.stock = normalized.stock;
    existing.precio = normalized.precio;
  } else {
    items.value.push({
      ...normalized,
      cantidad: clampQuantity(quantity, normalized.stock)
    });
  }

  saveCart();
  return { ok: true, message: 'Producto agregado al carrito.' };
};

const updateQuantity = (idProduct, quantity) => {
  const item = items.value.find((cartItem) => cartItem.id_producto === Number(idProduct));
  if (!item) return;

  item.cantidad = clampQuantity(quantity, item.stock);
  saveCart();
};

const incrementQuantity = (idProduct) => {
  const item = items.value.find((cartItem) => cartItem.id_producto === Number(idProduct));
  if (!item) return;
  updateQuantity(idProduct, item.cantidad + 1);
};

const decrementQuantity = (idProduct) => {
  const item = items.value.find((cartItem) => cartItem.id_producto === Number(idProduct));
  if (!item) return;

  if (item.cantidad <= 1) {
    removeFromCart(idProduct);
    return;
  }

  updateQuantity(idProduct, item.cantidad - 1);
};

const removeFromCart = (idProduct) => {
  items.value = items.value.filter((item) => item.id_producto !== Number(idProduct));
  saveCart();
};

const clearCart = () => {
  items.value = [];
  saveCart();
};

const totalItems = computed(() => items.value.reduce((total, item) => total + item.cantidad, 0));
const subtotal = computed(() => items.value.reduce((total, item) => total + item.precio * item.cantidad, 0));
const iva = computed(() => Number((subtotal.value * 0.12).toFixed(2)));
const total = computed(() => Number((subtotal.value + iva.value).toFixed(2)));

export const useCart = () => ({
  items,
  totalItems,
  subtotal,
  iva,
  total,
  addToCart,
  updateQuantity,
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
  clearCart
});
