// Prices and money formatting. Shared by the browser and the server
// (functions/api/order.js), so both always show the same amounts.

import { products, packages } from "../../data/catalog.js";
import { settings } from "../../data/settings.js";

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

/** Deposit paid by bank transfer before a package request is sent (settings.payment.depositRate). */
export function depositCents(pkg) {
  return Math.round(toCents(pkg.price) * settings.payment.depositRate);
}

const formatter = new Intl.NumberFormat(settings.locale, { style: "currency", currency: settings.currency });

export function formatMoney(cents) {
  return formatter.format(cents / 100);
}
