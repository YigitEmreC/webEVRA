// The visitor's package request lives in their own browser (localStorage):
//   { package: "genel-ev" | null, extras: ["product-id", ...] }
// Only packages are bought on the site. Products can only be added as extras
// after a package is chosen; their price is agreed with the customer later.
// Nothing is sent anywhere until the request form on /cart.html is submitted.

const KEY = "order.v1";
const EVENT = "order:change";
const MAX_EXTRAS = 50;
let memory = { package: null, extras: [] }; // fallback when storage is blocked (private mode, etc.)

function clean(data) {
  return {
    package: typeof data?.package === "string" && data.package ? data.package : null,
    extras: Array.isArray(data?.extras) ? [...new Set(data.extras.filter((id) => typeof id === "string" && id))].slice(0, MAX_EXTRAS) : [],
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

export function hasExtra(id) {
  return read().extras.includes(id);
}

/** Adds or removes an extra product. Returns true when it is now selected. */
export function toggleExtra(id) {
  const order = read();
  const on = !order.extras.includes(id);
  write({ ...order, extras: on ? [...order.extras, id] : order.extras.filter((x) => x !== id) });
  return on;
}

export function removeExtra(id) {
  const order = read();
  write({ ...order, extras: order.extras.filter((x) => x !== id) });
}

export function clearOrder() {
  write({ package: null, extras: [] });
}

/** Number shown on the header badge: the package plus each extra. */
export function orderCount(order = read()) {
  return (order.package ? 1 : 0) + order.extras.length;
}

/** Calls fn whenever the order changes, in this tab or another one. */
export function onOrderChange(fn) {
  window.addEventListener(EVENT, () => fn(read()));
  window.addEventListener("storage", (e) => {
    if (e.key === KEY) fn(read());
  });
}
