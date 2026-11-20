// Rules for "Kendi paketini oluştur" packages, shared by the browser (builder,
// Products page, Siparişim) and the server (functions/api/order.js), so the price
// the customer sees is the price in the sales e-mail.
//
// A custom package is stored as
//   { size: "3+1", balconies: 2, heating: "kombi-petek",
//     items: [{ id: "hub", qty: 1 }, ...],
//     placements: { living: { "wall-panel": 1 }, bed1: { "radiator-valve": 1 } } }
// balconies: 0–4, or null when not asked yet. placements say which room of the
// floor plan (floor-plan.js) each product goes in; products not placed in any
// room are still in the package. Data and rules: public/data/builder.js.

import { CUSTOM_ID, CUSTOM_NAME, MAX_BALCONIES, homeSizes, systemItems, heatingSystems, questions } from "../../data/builder.js";
import { planRooms } from "./floor-plan.js";
import { findItem, toCents } from "./pricing.js";
import { settings } from "../../data/settings.js";

export { CUSTOM_ID, CUSTOM_NAME, MAX_BALCONIES };
export const CUSTOM_MAX_QTY = 20;
/** One per home: the main system. Never offered as an extra or in the room lists. */
export const SINGLE_ITEMS = ["hub"];

export const sizeOf = (id) => homeSizes.find((s) => s.id === id) || null;
export const heatingOf = (id) => heatingSystems.find((h) => h.id === id) || null;

/** System + heating products with their starting quantity and minimum. */
export function requiredItems(size, heating) {
  const rooms = sizeOf(size)?.rooms || 1;
  const list = [...systemItems.map((i) => ({ ...i, group: "system" }))];
  for (const i of heatingOf(heating)?.items || []) {
    list.push({ id: i.id, qty: i.qty === "rooms" ? rooms : i.qty, min: i.min || 0, room: i.room, group: "heating" });
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
  for (const id of SINGLE_ITEMS) if (qty.has(id)) qty.set(id, 1);
  const balconies = cleanBalconies(raw);
  const items = [...qty].map(([id, q]) => ({ id, qty: q }));
  return {
    size: size.id,
    balconies,
    heating: heating.id,
    items,
    placements: normalizePlacements(raw.placements, items, roomsOf(size.id, balconies)),
    answers: cleanAnswers(raw.answers),
  };
}

// ── Questions ("Sorular" step): the system suggests products ───────────────────

export const questionOf = (id) => questions.find((q) => q.id === id) || null;

/** { safety: true, pets: false, … } with only known questions. */
export function cleanAnswers(raw) {
  const out = {};
  if (!raw || typeof raw !== "object") return out;
  for (const q of questions) if (typeof raw[q.id] === "boolean") out[q.id] = raw[q.id];
  return out;
}

/** The room ids a question item goes to in this home (see data/builder.js → room). */
export function resolveRooms(spec, rooms) {
  const ids = rooms.map((r) => r.id);
  const has = (id) => ids.includes(id);
  const beds = rooms.filter((r) => r.kind === "bed").map((r) => r.id);
  switch (spec.room) {
    case "rooms":
      return ["living", ...beds].filter(has);
    case "bedrooms":
      return beds;
    case "kids":
      return [has("bed2") ? "bed2" : "bed1"];
    case "balconies": {
      const balconies = rooms.filter((r) => r.kind === "balcony").map((r) => r.id);
      return balconies.length ? balconies : spec.fallback && has(spec.fallback) ? [spec.fallback] : [];
    }
    default:
      return has(spec.room) ? [spec.room] : [];
  }
}

/** What a question puts where: { room: { productId: qty } }. */
export function questionPlacements(question, size, balconies) {
  const rooms = roomsOf(size, balconies);
  const out = {};
  for (const spec of question?.items || []) {
    for (const room of resolveRooms(spec, rooms)) {
      const slot = (out[room] ||= {});
      slot[spec.id] = (slot[spec.id] || 0) + (spec.qty || 1);
    }
  }
  return out;
}

/**
 * Answering a question. "Evet" makes sure its products are in their rooms;
 * "Hayır" takes out what only this question had added (products another "Evet"
 * also wants stay). Products the customer added by hand are left alone.
 * Returns { items, placements, answers }.
 */
export function applyAnswer(custom, questionId, yes) {
  const q = questionOf(questionId);
  const items = new Map(custom.items.map((i) => [i.id, i.qty]));
  const placements = JSON.parse(JSON.stringify(custom.placements || {}));
  const answers = { ...(custom.answers || {}), [questionId]: yes };
  const mine = questionPlacements(q, custom.size, custom.balconies);
  const others = questions
    .filter((o) => o.id !== questionId && answers[o.id])
    .map((o) => questionPlacements(o, custom.size, custom.balconies));
  for (const [room, entries] of Object.entries(mine)) {
    for (const [id, qty] of Object.entries(entries)) {
      const now = placements[room]?.[id] || 0;
      if (yes) {
        if (now >= qty) continue;
        const add = Math.min(qty - now, CUSTOM_MAX_QTY - (items.get(id) || 0));
        if (add <= 0) continue;
        (placements[room] ||= {})[id] = now + add;
        items.set(id, (items.get(id) || 0) + add);
      } else {
        const keep = Math.max(0, ...others.map((o) => o[room]?.[id] || 0));
        const remove = Math.min(now - keep, qty);
        if (remove <= 0) continue;
        placements[room][id] = now - remove;
        if (!placements[room][id]) delete placements[room][id];
        items.set(id, Math.max((items.get(id) || 0) - remove, minQty(custom, id)));
      }
    }
  }
  const list = [...items].filter(([, n]) => n > 0).map(([id, qty]) => ({ id, qty }));
  return { items: list, placements: normalizePlacements(placements, list, roomsOf(custom.size, custom.balconies)), answers };
}

/**
 * Builds a package from scratch: system + heating products in their rooms, then
 * every "Evet" answer. Used when the home itself changes after the questions.
 */
export function buildFromAnswers(size, balconies, heating, answers = {}) {
  let custom = { size, balconies, heating, items: startItems(size, heating), placements: {}, answers: {} };
  custom.placements = autoPlace(custom);
  for (const q of questions) {
    if (answers[q.id] === undefined) continue;
    custom = { ...custom, ...applyAnswer(custom, q.id, answers[q.id]) };
  }
  return custom;
}

/** 0–4 balconies, null when not answered (older saves had balcony: true/false). */
export function cleanBalconies(raw) {
  if (Number.isInteger(raw?.balconies)) return Math.max(0, Math.min(raw.balconies, MAX_BALCONIES));
  if (typeof raw?.balcony === "boolean") return raw.balcony ? 1 : 0;
  return null;
}

/** The rooms of the plan for a home size and balcony count. */
export function roomsOf(size, balconies) {
  const s = sizeOf(size);
  return s && !s.large ? planRooms(s.bedrooms, balconies || 0) : [];
}

/**
 * Keeps only real rooms and products of the package, and never places more of a
 * product than the package has (rooms earlier in the plan keep theirs first).
 */
export function normalizePlacements(placements, items, rooms) {
  const left = new Map(items.map((i) => [i.id, i.qty]));
  const out = {};
  if (!placements || typeof placements !== "object") return out;
  for (const { id: room } of rooms) {
    const entries = placements[room];
    if (!entries || typeof entries !== "object") continue;
    for (const [id, raw] of Object.entries(entries)) {
      const n = Math.min(Math.floor(Number(raw)) || 0, left.get(id) || 0);
      if (n <= 0) continue;
      (out[room] ||= {})[id] = n;
      left.set(id, left.get(id) - n);
    }
  }
  return out;
}

/** How many of a product are placed in rooms. */
export function placedQty(placements, id) {
  return Object.values(placements || {}).reduce((sum, room) => sum + (room[id] || 0), 0);
}

/**
 * Puts required products in their usual rooms (public/data/builder.js → room):
 * the hub in the hallway, the wall panel in the living room, one radiator valve
 * per room … Only products in `ids` (default: all required ones) and only the
 * quantity not placed yet. Returns new placements.
 */
export function autoPlace(custom, ids = null) {
  const rooms = roomsOf(custom.size, custom.balconies);
  const exists = new Set(rooms.map((r) => r.id));
  const placements = JSON.parse(JSON.stringify(custom.placements || {}));
  const qtyOf = (id) => custom.items.find((i) => i.id === id)?.qty || 0;
  for (const req of requiredItems(custom.size, custom.heating)) {
    if (!req.room || (ids && !ids.includes(req.id))) continue;
    let left = qtyOf(req.id) - placedQty(placements, req.id);
    const targets = req.room === "rooms" ? ["living", ...rooms.filter((r) => r.kind === "bed").map((r) => r.id)] : [req.room];
    for (const room of targets) {
      if (left <= 0) break;
      if (!exists.has(room)) continue;
      const add = req.room === "rooms" ? (placements[room]?.[req.id] ? 0 : 1) : left;
      if (!add) continue;
      (placements[room] ||= {})[req.id] = (placements[room]?.[req.id] || 0) + add;
      left -= add;
    }
  }
  return normalizePlacements(placements, custom.items, rooms);
}

/** Rooms with their products, for the order summary and the sales e-mail. */
export function roomSummary(custom) {
  const rooms = roomsOf(custom.size, custom.balconies);
  const list = rooms
    .map((room) => ({
      ...room,
      items: Object.entries(custom.placements?.[room.id] || {})
        .map(([id, qty]) => ({ item: findItem(id), qty }))
        .filter((x) => x.item && x.qty > 0),
    }))
    .filter((room) => room.items.length);
  const unplaced = custom.items
    .map(({ id, qty }) => ({ item: findItem(id), qty: qty - placedQty(custom.placements, id) }))
    .filter((x) => x.item && x.qty > 0);
  return { rooms: list, unplaced };
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
    context: `${size.label} ev${balconyText(clean.balconies, " · ")} · ${heating.name}`,
    price: customPrice(clean.items).total,
    items: clean.items,
    size: clean.size,
    balconies: clean.balconies,
    heating: clean.heating,
    placements: clean.placements,
    answers: clean.answers,
  };
}

/** "balkonsuz" / "balkonlu" / "2 balkonlu" (with a prefix), or "" when not asked. */
export function balconyText(balconies, prefix = "") {
  if (balconies === null || balconies === undefined) return "";
  if (balconies === true || balconies === 1) return `${prefix}balkonlu`;
  if (balconies === false || balconies === 0) return `${prefix}balkonsuz`;
  return `${prefix}${balconies} balkonlu`;
}

/** The package in an order (a catalog package or the customer's own one), or null. */
export function orderPackage(order) {
  if (!order?.package) return null;
  if (order.package === CUSTOM_ID) return customPackage(order.custom);
  const pkg = findItem(order.package);
  return pkg && pkg.kind === "package" ? pkg : null;
}
