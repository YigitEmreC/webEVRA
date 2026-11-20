// Rules for "Kendi paketini oluştur" packages, shared by the browser (builder,
// Products page, Siparişim) and the server (functions/api/order.js), so the price
// the customer sees is the price in the sales e-mail.
//
// A custom package is stored as { size: "3+1", heating: "kombi-petek",
// items: [{ id: "hub", qty: 1 }, ...] }. Data and rules: public/data/builder.js.

import { CUSTOM_ID, CUSTOM_NAME, homeSizes, systemItems, heatingSystems } from "../../data/builder.js";
import { findItem, toCents } from "./pricing.js";
import { settings } from "../../data/settings.js";

export { CUSTOM_ID, CUSTOM_NAME };
export const CUSTOM_MAX_QTY = 20;

export const sizeOf = (id) => homeSizes.find((s) => s.id === id) || null;
export const heatingOf = (id) => heatingSystems.find((h) => h.id === id) || null;

/** System + heating products with their starting quantity and minimum. */
export function requiredItems(size, heating) {
  const rooms = sizeOf(size)?.rooms || 1;
  const list = [...systemItems.map((i) => ({ ...i, group: "system" }))];
  for (const i of heatingOf(heating)?.items || []) {
    list.push({ id: i.id, qty: i.qty === "rooms" ? rooms : i.qty, min: i.min || 0, group: "heating" });
  }
  return list;
}

/** Least quantity allowed for a product in this package (0 for most). */
export function minQty(custom, id) {
  if (!custom) return 0;
  return Math.max(0, ...requiredItems(custom.size, custom.heating).filter((i) => i.id === id).map((i) => i.min));
}

/** The starting items for a size + heating choice. */
export function startItems(size, heating) {
  return requiredItems(size, heating).map(({ id, qty }) => ({ id, qty }));
}

/**
 * Checks a custom package and fixes it up: known size (not 5+1 and above) and
 * heating, real products only, quantities 0–20, minimums enforced.
 * Returns null when it can't be a package.
 */
export function cleanCustom(raw) {
  if (!raw || typeof raw !== "object") return null;
  const size = sizeOf(raw.size);
  const heating = heatingOf(raw.heating);
  if (!size || size.large || !heating) return null;
  const qty = new Map();
  for (const entry of Array.isArray(raw.items) ? raw.items.slice(0, 100) : []) {
    const item = findItem(entry?.id);
    const n = Math.floor(Number(entry?.qty));
    if (!item || item.kind !== "product" || !(n > 0)) continue;
    qty.set(item.id, Math.min((qty.get(item.id) || 0) + n, CUSTOM_MAX_QTY));
  }
  for (const r of requiredItems(size.id, heating.id)) {
    if ((qty.get(r.id) || 0) < r.min) qty.set(r.id, r.min);
  }
  return { size: size.id, heating: heating.id, items: [...qty].map(([id, q]) => ({ id, qty: q })) };
}

/** Price of a custom package (settings.js → pricing), with the steps for the sales e-mail. */
export function customPrice(items) {
  const P = settings.pricing;
  const catalog = items.reduce((sum, { id, qty }) => sum + (findItem(id)?.price || 0) * qty, 0);
  const products = P.catalogPricesIncludeVat ? catalog / (1 + P.vat) : catalog;
  const withMarkup = products * (1 + P.productMarkup);
  const withService = withMarkup + P.electrician + P.travel;
  const withWarranty = withService * (1 + P.warranty);
  const withMargin = withWarranty * (1 + P.margin);
  const total = Math.round(withMargin * (1 + P.vat));
  return {
    total,
    steps: [
      ["Ürünler (KDV hariç)", products],
      [`+ %${Math.round(P.productMarkup * 100)} ürün payı`, withMarkup],
      [`+ Elektrikçi/servis ${P.electrician} TL + ulaşım ${P.travel} TL`, withService],
      [`+ %${Math.round(P.warranty * 100)} garanti`, withWarranty],
      [`+ %${Math.round(P.margin * 100)} kâr payı`, withMargin],
      [`+ %${Math.round(P.vat * 100)} KDV (yuvarlanmış)`, total],
    ].map(([label, tl]) => [label, toCents(tl)]),
  };
}

/** A custom package shaped like the packages in catalog.js. */
export function customPackage(custom) {
  const clean = cleanCustom(custom);
  if (!clean) return null;
  const size = sizeOf(clean.size);
  const heating = heatingOf(clean.heating);
  return {
    id: CUSTOM_ID,
    kind: "package",
    custom: true,
    name: CUSTOM_NAME,
    context: `${size.label} ev · ${heating.name}`,
    price: customPrice(clean.items).total,
    items: clean.items,
    size: clean.size,
    heating: clean.heating,
  };
}

/** The package in an order (a catalog package or the customer's own one), or null. */
export function orderPackage(order) {
  if (!order?.package) return null;
  if (order.package === CUSTOM_ID) return customPackage(order.custom);
  const pkg = findItem(order.package);
  return pkg && pkg.kind === "package" ? pkg : null;
}
