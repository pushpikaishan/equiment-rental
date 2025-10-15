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
    const available = Number(product.quantity);
    const nextQty = (cart[idx].qty || 0) + qty;
    cart[idx].qty = available > 0 ? Math.min(nextQty, available) : Math.max(1, nextQty);
    // keep latest known available quantity
    cart[idx].quantity = Number.isFinite(available) ? available : cart[idx].quantity;
  } else {
    cart.push({ 
      _id: product._id, 
      name: product.name, 
      price: product.rentalPrice, 
      image: product.image, 
      qty: Math.max(1, qty),
      quantity: Number(product.quantity) || 0
    });
  }
  saveCart(cart);
  return cart;
};

export const updateQty = (id, qty) => {
  const cart = getCart();
  const idx = cart.findIndex((i) => i._id === id);
  if (idx >= 0) {
    const available = Number(cart[idx].quantity);
    const desired = Math.max(1, Number(qty) || 1);
    cart[idx].qty = available > 0 ? Math.min(desired, available) : desired;
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
