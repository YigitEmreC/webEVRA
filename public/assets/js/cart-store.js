// The visitor's package request lives in their own browser (localStorage):
//   { package: "genel-ev" | null, extras: [{ id: "product-id", qty: 2 }, ...] }
// Only packages are bought on the site. Products can only be added as extras
// after a package is chosen; their price is agreed with the customer later.
// Nothing is sent anywhere until the request form on /cart.html is submitted.

const KEY = "order.v1";
const EVENT = "order:change";
const MAX_EXTRAS = 50;
export const MAX_QTY = 20;
let memory = { package: null, extras: [] }; // fallback when storage is blocked (private mode, etc.)

function clean(data) {
  const seen = new Map();
  for (const entry of Array.isArray(data?.extras) ? data.extras : []) {
    // older saves stored plain ids
    const id = typeof entry === "string" ? entry : entry?.id;
    const qty = typeof entry === "string" ? 1 : Math.floor(Number(entry?.qty));
    if (typeof id !== "string" || !id || !(qty > 0)) continue;
    seen.set(id, Math.min((seen.get(id) || 0) + qty, MAX_QTY));
  }
  return {
    package: typeof data?.package === "string" && data.package ? data.package : null,
    extras: [...seen].slice(0, MAX_EXTRAS).map(([id, qty]) => ({ id, qty })),
  };
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? clean(JSON.parse(raw)) : clean(memory);
  } catch {
    return clean(memory);
  }
}

function write(order) {
  memory = clean(order);
  try {
    localStorage.setItem(KEY, JSON.stringify(memory));
  } catch {
    /* storage unavailable: keep the in-memory copy */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: memory }));
}

export function getOrder() {
  return read();
}

/** Choose (or replace) the package. Extras already picked are kept. */
export function setPackage(id) {
  write({ ...read(), package: id });
}

/** How many of a product are in the request (0 if none). */
export function extraQty(id, order = read()) {
  return order.extras.find((e) => e.id === id)?.qty || 0;
}

/** Sets the quantity of an extra product; 0 removes it. */
export function setExtraQty(id, qty) {
  const order = read();
  const n = Math.max(0, Math.min(Math.floor(qty), MAX_QTY));
  const others = order.extras.filter((e) => e.id !== id);
  const exists = order.extras.some((e) => e.id === id);
  const extras = n === 0 ? others : exists ? order.extras.map((e) => (e.id === id ? { id, qty: n } : e)) : [...order.extras, { id, qty: n }];
  write({ ...order, extras });
}

export function removeExtra(id) {
  setExtraQty(id, 0);
}

/** Removes the package. Extras can't be bought without one, so they go too. */
export function removePackage() {
  write({ package: null, extras: [] });
}

export function clearOrder() {
  write({ package: null, extras: [] });
}

/** Total number of extra items (quantities added up). */
export function extrasCount(order = read()) {
  return order.extras.reduce((sum, e) => sum + e.qty, 0);
}

/** Number shown on the header badge: the package plus every extra item. */
export function orderCount(order = read()) {
  return (order.package ? 1 : 0) + extrasCount(order);
}

/** Calls fn whenever the order changes, in this tab or another one. */
export function onOrderChange(fn) {
  window.addEventListener(EVENT, () => fn(read()));
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) fn(read());
  });
}
