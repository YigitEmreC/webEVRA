// Prices the cart. Shared by the browser (cart page) and the server
// (functions/api/checkout.js), so both always agree on the total.
// The server never trusts prices sent by the browser: it only receives
// ids and quantities and looks the prices up here.

import { products, packages } from "../../data/catalog.js";
import { settings } from "../../data/settings.js";

export const MAX_QTY = 99;
export const MAX_LINES = 50;

const index = new Map();
for (const p of products) index.set(p.id, { ...p, kind: "product" });
for (const p of packages) index.set(p.id, { ...p, kind: "package" });

export function findItem(id) {
  return index.get(String(id)) || null;
}

export function toCents(amount) {
  return Math.round(Number(amount) * 100);
}

/** Sum of the separate product prices inside a package, in cents. */
export function packageValueCents(pkg) {
  return (pkg.items || []).reduce((sum, { id, qty }) => {
    const item = findItem(id);
    return item ? sum + toCents(item.price) * qty : sum;
  }, 0);
}

export function shippingCents(subtotalCents, lineCount) {
  const { fee, freeFrom } = settings.shipping;
  if (!lineCount || !fee) return 0;
  if (freeFrom != null && subtotalCents >= toCents(freeFrom)) return 0;
  return toCents(fee);
}

/**
 * Turns [{ id, qty }] into priced lines. Unknown ids and invalid quantities
 * are dropped, duplicate ids are merged, quantities are capped at MAX_QTY.
 */
export function priceCart(cartItems) {
  const merged = new Map();
  for (const entry of Array.isArray(cartItems) ? cartItems : []) {
    const item = findItem(entry?.id);
    const qty = Math.floor(Number(entry?.qty));
    if (!item || !Number.isFinite(qty) || qty < 1) continue;
    merged.set(item.id, Math.min((merged.get(item.id) || 0) + qty, MAX_QTY));
  }

  const lines = [...merged]
    .slice(0, MAX_LINES)
    .map(([id, quantity]) => {
      const item = findItem(id);
      const unitCents = toCents(item.price);
      return { item, quantity, unitCents, totalCents: unitCents * quantity };
    });

  const subtotalCents = lines.reduce((sum, line) => sum + line.totalCents, 0);
  const shipping = shippingCents(subtotalCents, lines.length);
  return {
    lines,
    count: lines.reduce((sum, line) => sum + line.quantity, 0),
    subtotalCents,
    shippingCents: shipping,
    totalCents: subtotalCents + shipping,
  };
}

const formatter = new Intl.NumberFormat(settings.locale, { style: "currency", currency: settings.currency });

export function formatMoney(cents) {
  return formatter.format(cents / 100);
}
