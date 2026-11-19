// The cart lives in the visitor's own browser (localStorage) as [{ id, qty }].
// Nothing is sent anywhere until they press "Go to secure checkout".

const KEY = "cart.v1";
const EVENT = "cart:change";
let memory = []; // fallback when storage is blocked (private mode, etc.)

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data.filter((i) => i && typeof i.id === "string" && i.qty > 0) : [];
  } catch {
    return memory;
  }
}

function write(items) {
  memory = items;
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* storage unavailable: keep the in-memory copy */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: items }));
}

export function getCart() {
  return read();
}

export function addToCart(id, qty = 1) {
  const items = read();
  const line = items.find((i) => i.id === id);
  if (line) line.qty = Math.min(line.qty + qty, 99);
  else items.push({ id, qty });
  write(items);
}

export function setQty(id, qty) {
  const items = read();
  const n = Math.floor(qty);
  write(n > 0 ? items.map((i) => (i.id === id ? { ...i, qty: Math.min(n, 99) } : i)) : items.filter((i) => i.id !== id));
}

export function removeFromCart(id) {
  write(read().filter((i) => i.id !== id));
}

export function clearCart() {
  write([]);
}

/** Calls fn whenever the cart changes, in this tab or another one. */
export function onCartChange(fn) {
  window.addEventListener(EVENT, () => fn(read()));
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) fn(read());
  });
}
