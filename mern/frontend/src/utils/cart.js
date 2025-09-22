// Simple localStorage-based cart utility

const KEY = 'cart';

const safeParse = (v) => {
  try { return JSON.parse(v || '[]'); } catch { return []; }
};

export const getCart = () => {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(KEY));
};

export const getCartCount = () => {
  return getCart().reduce((sum, item) => sum + (item.qty || 0), 0);
};

export const saveCart = (cart) => {
  localStorage.setItem(KEY, JSON.stringify(cart));
};

export const addToCart = (product, qty = 1) => {
  const cart = getCart();
  const idx = cart.findIndex((i) => i._id === product._id);
  if (idx >= 0) {
    cart[idx].qty = Math.min((cart[idx].qty || 0) + qty, Number(product.quantity) || 9999);
  } else {
    cart.push({ _id: product._id, name: product.name, price: product.rentalPrice, image: product.image, qty });
  }
  saveCart(cart);
  return cart;
};

export const updateQty = (id, qty) => {
  const cart = getCart();
  const idx = cart.findIndex((i) => i._id === id);
  if (idx >= 0) {
    cart[idx].qty = Math.max(1, qty);
    saveCart(cart);
  }
  return cart;
};

export const removeFromCart = (id) => {
  const cart = getCart().filter((i) => i._id !== id);
  saveCart(cart);
  return cart;
};

export const clearCart = () => {
  saveCart([]);
};
