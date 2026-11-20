// "Kendi paketini oluştur" on the Packages page (#builder), step by step:
//   1 Ev büyüklüğü + balkon sayısı → 2 Isıtma sistemi → 3 Sistem (required
//   products, filled in automatically) → 4 Ürünler → 5 Özet ve fiyat.
// From step 1 on, a bird's-eye floor plan of the home (floor-plan.js) stays
// beside the steps (on phones: pinned at the top). Once the heating is chosen,
// every room of the plan can be opened ("oda düzenleyici") to put products in
// it; they show as small emblems on the room. Required products are placed in
// their usual rooms automatically (data/builder.js → room).
// "5+1 ve üzeri" doesn't build a package: it opens the planning form (#planning).
// The price is calculated live (builder-core.js → customPrice, settings.js → pricing).
// The draft is kept in this browser (localStorage "builder.v1") until it is chosen;
// then it becomes the order's own package (cart-store.js → setCustom).

import { products } from "../../data/catalog.js";
import { homeSizes, heatingSystems } from "../../data/builder.js";
import { findItem, formatMoney, toCents, depositCents } from "./pricing.js";
import {
  CUSTOM_ID,
  CUSTOM_MAX_QTY,
  MAX_BALCONIES,
  sizeOf,
  heatingOf,
  requiredItems,
  minQty,
  startItems,
  customPrice,
  customPackage,
  balconyText,
  cleanBalconies,
  roomsOf,
  normalizePlacements,
  placedQty,
  autoPlace,
  roomSummary,
} from "./builder-core.js";
import { floorPlanSvg, emblemsSvg, categoryIcon } from "./floor-plan.js";
import { getOrder, setCustom } from "./cart-store.js";
import { settings } from "../../data/settings.js";
import { escapeHtml, icon, mediaHtml } from "./ui.js";

const KEY = "builder.v1";
const STEPS = ["Ev büyüklüğü", "Isıtma", "Sistem", "Ürünler", "Özet"];

function loadDraft() {
  const order = getOrder();
  if (order.custom) return { step: 4, room: null, ...order.custom };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") {
      return {
        step: Math.min(Math.max(Number(saved.step) || 0, 0), 4),
        room: null,
        size: sizeOf(saved.size)?.id || null,
        balconies: cleanBalconies(saved),
        heating: heatingOf(saved.heating)?.id || null,
        items: Array.isArray(saved.items) ? saved.items.filter((i) => findItem(i?.id) && i.qty > 0) : [],
        placements: saved.placements && typeof saved.placements === "object" ? saved.placements : {},
      };
    }
  } catch {
    /* storage blocked or broken: start fresh */
  }
  return { step: 0, room: null, size: null, balconies: null, heating: null, items: [], placements: {} };
}

/** Small inline SVG of a product's category, like the emblems on the plan. */
const emblemIcon = (p) => `<span class="room-emblem" aria-hidden="true"><svg viewBox="0 0 24 24">${categoryIcon(p.category)}</svg></span>`;

export function initBuilder() {
  const root = document.getElementById("builder");
  if (!root) return;
  const planning = document.getElementById("planning");

  let state = loadDraft();
  // A step can only be shown when the earlier choices are made.
  const maxStep = () => (!state.size || sizeOf(state.size).large || state.balconies === null ? 0 : !state.heating ? 1 : 4);
  const canEditRooms = () => maxStep() >= 2;
  state.step = Math.min(state.step, maxStep());

  const save = () => {
    try {
      const { room, ...rest } = state;
      localStorage.setItem(KEY, JSON.stringify(rest));
    } catch {
      /* not saved; fine */
    }
  };
  const qtyOf = (id) => state.items.find((i) => i.id === id)?.qty || 0;
  const custom = () => ({ size: state.size, balconies: state.balconies, heating: state.heating, items: state.items, placements: state.placements });
  const rooms = () => roomsOf(state.size, state.balconies);
  const roomQty = (room, id) => state.placements[room]?.[id] || 0;
  const normalize = () => (state.placements = normalizePlacements(state.placements, state.items, rooms()));
  state.placements = state.placements || {};
  normalize();

  // Fixed frame; only the parts that change are redrawn (the plan only when the
  // home changes, so its animation doesn't replay on every click).
  root.innerHTML = `
    <ol class="builder-steps" data-steps></ol>
    <div class="builder-layout">
      <div class="builder-panel" data-panel></div>
      <aside class="builder-side" data-side>
        <div class="builder-plan-wrap">
          <div class="builder-plan-head">
            <p class="cart-line-kind">Eviniz · kuşbakışı</p>
            <button type="button" class="link-button builder-plan-toggle" data-toggle-plan aria-expanded="true">Krokiyi gizle</button>
          </div>
          <figure class="builder-plan" data-plan></figure>
          <p class="builder-plan-hint muted" data-plan-hint></p>
        </div>
        <div data-summary></div>
      </aside>
    </div>`;
  const stepsEl = root.querySelector("[data-steps]");
  const panelEl = root.querySelector("[data-panel]");
  const sideEl = root.querySelector("[data-side]");
  const planEl = root.querySelector("[data-plan]");
  const hintEl = root.querySelector("[data-plan-hint]");
  const summaryEl = root.querySelector("[data-summary]");
  let planKey = null;

  function setQty(id, qty) {
    const n = Math.max(minQty(custom(), id), Math.min(qty, CUSTOM_MAX_QTY));
    const exists = state.items.some((i) => i.id === id);
    state.items = n
      ? exists
        ? state.items.map((i) => (i.id === id ? { id, qty: n } : i))
        : [...state.items, { id, qty: n }]
      : state.items.filter((i) => i.id !== id);
    normalize();
  }

  /** One more / one less of a product in a room (the package total follows). */
  function changeInRoom(room, id, delta) {
    const inRoom = roomQty(room, id);
    if (delta > 0) {
      const unplaced = qtyOf(id) - placedQty(state.placements, id);
      if (unplaced <= 0) {
        if (qtyOf(id) >= CUSTOM_MAX_QTY) return;
        setQty(id, qtyOf(id) + 1);
      }
      (state.placements[room] ||= {})[id] = inRoom + 1;
    } else {
      if (inRoom <= 0) return;
      state.placements[room][id] = inRoom - 1;
      if (!state.placements[room][id]) delete state.placements[room][id];
      setQty(id, qtyOf(id) - 1); // a required product stays at its minimum, just without a room
    }
    normalize();
  }

  const perRoomIds = () => (heatingOf(state.heating)?.items || []).filter((i) => i.qty === "rooms").map((i) => i.id);

  function chooseSize(id) {
    const before = state.size;
    state.size = id;
    if (sizeOf(id).large) {
      state.room = null;
      return;
    }
    // Per-room products (valves, actuators) follow the new room count.
    if (before && state.heating && before !== id) {
      const oldRooms = sizeOf(before)?.rooms;
      for (const pid of perRoomIds()) {
        if (!sizeOf(before)?.large && qtyOf(pid) === oldRooms) setQty(pid, sizeOf(id).rooms);
      }
    }
    normalize();
    if (state.heating) state.placements = autoPlace(custom(), perRoomIds());
    if (state.room && !rooms().some((r) => r.id === state.room)) state.room = null;
  }

  function chooseBalconies(n) {
    state.balconies = n;
    normalize();
    if (state.room && !rooms().some((r) => r.id === state.room)) state.room = null;
  }

  function chooseHeating(id) {
    if (state.heating === id) {
      state.step = 2;
      return;
    }
    // Take out the previous heating system's products, put in the new one's.
    const system = new Set(requiredItems(state.size, null).map((i) => i.id));
    const oldIds = new Set((heatingOf(state.heating)?.items || []).map((i) => i.id).filter((x) => !system.has(x)));
    state.items = state.items.filter((i) => !oldIds.has(i.id));
    state.heating = id;
    const start = startItems(state.size, id);
    for (const s of start) {
      if (qtyOf(s.id) < s.qty) setQty(s.id, s.qty);
    }
    normalize();
    state.placements = autoPlace(custom(), start.map((s) => s.id));
    state.step = 2;
  }

  // ── Drawing ───────────────────────────────────────────────────────────────
  function draw() {
    const focusKey = document.activeElement?.dataset?.focusKey;
    const large = state.size && sizeOf(state.size).large;
    const ownPackage = getOrder().package === CUSTOM_ID;
    const showSummary = state.step >= 2 && !large;
    if (state.room && !canEditRooms()) state.room = null;

    stepsEl.innerHTML = `
        ${STEPS.map(
          (label, i) => `
          <li class="${i === state.step && !state.room ? "is-current" : i < state.step ? "is-done" : ""}">
            <button type="button" data-goto="${i}" ${i > maxStep() ? "disabled" : ""} ${i === state.step ? 'aria-current="step"' : ""}>
              <span class="step-num">${i < state.step ? icon("check") : i + 1}</span><span class="step-label">${label}</span>
            </button>
          </li>`
        ).join("")}`;
    panelEl.innerHTML = state.room ? roomEditor() : [stepSize, stepHeating, stepSystem, stepProducts, stepSummary][state.step](ownPackage);
    sideEl.hidden = Boolean(large);
    summaryEl.innerHTML = showSummary ? summaryHtml() : "";
    drawPlan();

    planning.hidden = !large;
    if (large) {
      const select = planning.querySelector("[name=size]");
      if (select && !select.value) select.value = "5+1";
    }
    if (focusKey) root.querySelector(`[data-focus-key="${focusKey}"]`)?.focus();
    save();
  }

  function drawPlan() {
    const size = state.size && sizeOf(state.size);
    const key = size && !size.large ? `${size.id}|${state.balconies}` : "none";
    if (key !== planKey) {
      planKey = key;
      if (key === "none") {
        planEl.innerHTML = `<div class="builder-plan-empty">${icon("layers")}<span>Ev büyüklüğünü seçin, krokiniz burada oluşsun.</span></div>`;
      } else {
        const caption = `${size.label}${balconyText(state.balconies, " · ")}`;
        planEl.innerHTML = floorPlanSvg({ bedrooms: size.bedrooms, balconies: state.balconies || 0, caption, interactive: true });
      }
    }
    if (key === "none") {
      hintEl.textContent = "";
      return;
    }
    // Emblems and the selected room change without redrawing the plan.
    const { html, filled } = emblemsSvg({ bedrooms: size.bedrooms, balconies: state.balconies || 0 }, state.placements, findItem);
    const svg = planEl.querySelector(".floor-plan");
    svg.querySelector("[data-emblems]").innerHTML = html;
    svg.querySelectorAll(".fp-room[data-room]").forEach((g) => {
      g.classList.toggle("has-items", filled.includes(g.dataset.room));
      g.classList.toggle("is-selected", g.dataset.room === state.room);
    });
    svg.classList.toggle("is-locked", !canEditRooms());
    hintEl.textContent =
      state.balconies === null
        ? `${size.label} · balkon sorusunu yanıtlayın`
        : !canEditRooms()
          ? `${size.label}${balconyText(state.balconies, " · ")} · ısıtmayı seçince odalara ürün ekleyebilirsiniz`
          : state.room
            ? `${rooms().find((r) => r.id === state.room)?.label || ""} düzenleniyor · başka bir odaya dokunabilirsiniz`
            : "Bir odaya dokunun, o odaya ürün ekleyin";
  }

  function navHtml({ back = true, next = null, nextLabel = "Devam et" } = {}) {
    return `
      <div class="builder-nav">
        ${back ? `<button type="button" class="btn btn-secondary" data-goto="${state.step - 1}">← Geri</button>` : "<span></span>"}
        ${next !== null ? `<button type="button" class="btn btn-primary" data-goto="${next}">${nextLabel} →</button>` : ""}
      </div>`;
  }

  function roomChips() {
    return `
      <div class="room-chips" role="group" aria-label="Odalar">
        ${rooms()
          .map((r) => {
            const n = Object.values(state.placements[r.id] || {}).reduce((a, b) => a + b, 0);
            return `<button type="button" class="chip" data-room="${r.id}" aria-pressed="${state.room === r.id}">${escapeHtml(r.label)}${n ? ` <span class="chip-count">${n}</span>` : ""}</button>`;
          })
          .join("")}
      </div>`;
  }

  function stepSize() {
    const large = state.size && sizeOf(state.size).large;
    const balconyOptions = Array.from({ length: MAX_BALCONIES + 1 }, (_, n) => n);
    return `
      <h3>Eviniz kaç oda?</h3>
      <p class="muted">Oda sayısına göre krokinizi çiziyor ve ısıtma ürünlerinin adedini hazırlıyoruz.</p>
      <div class="choice-grid choice-grid-sizes">
        ${homeSizes
          .map(
            (s) => `
          <button type="button" class="choice" data-size="${escapeHtml(s.id)}" aria-pressed="${state.size === s.id}">
            <strong>${escapeHtml(s.label)}</strong>
            <span class="muted">${s.large ? "Birlikte planlayalım" : `${s.rooms} oda (salon dahil)`}</span>
          </button>`
          )
          .join("")}
      </div>
      ${
        state.size && !large
          ? `
        <h3 class="builder-q">Balkonunuz var mı? Varsa kaç tane?</h3>
        <div class="choice-grid choice-grid-balcony">
          ${balconyOptions
            .map(
              (n) => `
            <button type="button" class="choice" data-balconies="${n}" aria-pressed="${state.balconies === n}">
              <strong>${n === 0 ? "Yok" : `${n} balkon`}</strong>
              <span class="muted">${n === 0 ? "Balkonsuz kroki" : n === 1 ? "Krokiye eklenir" : "Krokinin altına eklenir"}</span>
            </button>`
            )
            .join("")}
        </div>
        ${navHtml({ back: false, next: state.balconies === null ? null : 1 })}`
          : ""
      }
      ${
        large
          ? `<div class="notice-inline">${icon("layers")}<span><strong>Büyük evler için birlikte planlama yapıyoruz.</strong> 5+1 ve daha büyük evlerde ihtiyaçlar çok farklı olduğu için hazır fiyat vermiyoruz. Aşağıdaki planlama formunu doldurun, sizi arayıp evinize özel bir plan ve teklif hazırlayalım.</span></div>`
          : ""
      }`;
  }

  function stepHeating() {
    return `
      <h3>Isıtma sisteminiz nedir?</h3>
      <p class="muted">Seçiminize göre gerekli ısıtma ürünleri paketinize ve krokideki odalara otomatik eklenir. Bu adım zorunludur.</p>
      <div class="choice-grid">
        ${heatingSystems
          .map(
            (h) => `
          <button type="button" class="choice choice-wide" data-heating="${escapeHtml(h.id)}" aria-pressed="${state.heating === h.id}">
            <strong>${escapeHtml(h.name)}</strong>
            <span class="muted">${escapeHtml(h.text)}</span>
          </button>`
          )
          .join("")}
      </div>
      ${navHtml({ next: state.heating ? 2 : null })}`;
  }

  function stepSystem() {
    const required = requiredItems(state.size, state.heating);
    const system = required.filter((r) => r.group === "system");
    const heating = required.filter((r) => r.group === "heating");
    return `
      <h3>Sistem ve ısıtma</h3>
      <p class="muted">Sistemin çalışması için gereken ürünleri ekledik ve krokide odalarına yerleştirdik. Zorunlu ürünler en az bir adet kalır; adetleri değiştirebilir, krokide bir odaya dokunarak yerlerini değiştirebilirsiniz.</p>
      <h4 class="list-title">Sistem</h4>
      <ul class="builder-items">${system.map((r) => rowHtml(findItem(r.id), r.min)).join("")}</ul>
      <h4 class="list-title">Isıtma · ${escapeHtml(heatingOf(state.heating).name)}</h4>
      <ul class="builder-items">${heating.map((r) => rowHtml(findItem(r.id), r.min, r.min ? "" : "Önerilen")).join("")}</ul>
      ${navHtml({ next: 3 })}`;
  }

  function stepProducts() {
    const fixed = new Set(requiredItems(state.size, state.heating).map((r) => r.id));
    const groups = new Map();
    for (const p of products) {
      if (fixed.has(p.id)) continue;
      if (!groups.has(p.category)) groups.set(p.category, []);
      groups.get(p.category).push(p);
    }
    return `
      <h3>Ürünlerinizi seçin</h3>
      <p class="muted">Ürünleri bir odaya eklemek için krokide ya da aşağıda o odaya dokunun. Buradan eklediğiniz ürünler odası belirtilmeden pakete girer. Fiyat her değişiklikte güncellenir.</p>
      <p class="list-title">Odaya göre ekle</p>
      ${roomChips()}
      ${[...groups]
        .map(
          ([category, list]) => `
        <h4 class="list-title">${escapeHtml(category)}</h4>
        <ul class="builder-items">${list.map((p) => rowHtml(p, 0)).join("")}</ul>`
        )
        .join("")}
      ${navHtml({ next: 4, nextLabel: "Özete geç" })}`;
  }

  /** "Salon 1, Oda 2 1" under a product row. */
  function roomsLine(id) {
    const parts = rooms()
      .filter((r) => roomQty(r.id, id))
      .map((r) => `${escapeHtml(r.label)} ${roomQty(r.id, id)}`);
    const unplaced = qtyOf(id) - placedQty(state.placements, id);
    if (!parts.length) return "";
    return `<span class="builder-item-rooms">${icon("layers")} ${parts.join(" · ")}${unplaced > 0 ? ` · odası seçilmemiş ${unplaced}` : ""}</span>`;
  }

  function roomEditor() {
    const room = rooms().find((r) => r.id === state.room);
    const here = Object.entries(state.placements[room.id] || {})
      .map(([id]) => findItem(id))
      .filter(Boolean);
    const groups = new Map();
    for (const p of products) {
      if (!groups.has(p.category)) groups.set(p.category, []);
      groups.get(p.category).push(p);
    }
    return `
      <div class="room-editor">
        <button type="button" class="link-button" data-close-room>← ${STEPS[state.step]} adımına dön</button>
        <h3>${escapeHtml(room.label)}</h3>
        <p class="muted">Bu odaya koymak istediğiniz ürünleri seçin; krokide odanın üzerinde küçük simgeler olarak görünür. Fiyat her değişiklikte güncellenir.</p>
        ${roomChips()}
        <h4 class="list-title">Bu odada</h4>
        ${
          here.length
            ? `<ul class="builder-items">${here.map((p) => roomRowHtml(p, room.id)).join("")}</ul>`
            : `<p class="muted">Bu odada henüz ürün yok. Aşağıdan ekleyin.</p>`
        }
        ${[...groups]
          .map(
            ([category, list]) => `
          <details class="room-group">
            <summary>${escapeHtml(category)} <span class="muted">(${list.length})</span></summary>
            <ul class="builder-items">${list.map((p) => roomRowHtml(p, room.id)).join("")}</ul>
          </details>`
          )
          .join("")}
        <div class="builder-nav">
          <span></span>
          <button type="button" class="btn btn-primary" data-close-room>Tamam</button>
        </div>
      </div>`;
  }

  function roomRowHtml(p, room) {
    const id = escapeHtml(p.id);
    const name = escapeHtml(p.name);
    const qty = roomQty(room, p.id);
    const total = qtyOf(p.id);
    const full = total >= CUSTOM_MAX_QTY && total - placedQty(state.placements, p.id) <= 0;
    return `
      <li class="builder-item${qty ? " is-on" : ""}">
        <span class="extra-media">${mediaHtml(p)}</span>
        <div class="builder-item-info">
          <strong>${emblemIcon(p)}${name}</strong>
          <span class="muted">${total ? `Pakette toplam ${total} adet` : escapeHtml(p.description)}</span>
        </div>
        <div class="stepper stepper-sm" role="group" aria-label="${name}: bu odada adet">
          <button type="button" data-rqty="${id}" data-delta="-1" data-focus-key="rdec-${id}" aria-label="Bu odadan bir azalt" ${qty <= 0 ? "disabled" : ""}>−</button>
          <output>${qty}</output>
          <button type="button" data-rqty="${id}" data-delta="1" data-focus-key="rinc-${id}" aria-label="Bu odaya bir ekle" ${full ? "disabled" : ""}>+</button>
        </div>
      </li>`;
  }

  function stepSummary(ownPackage) {
    const pkg = customPackage(custom());
    const { rooms: withItems, unplaced } = roomSummary(custom());
    const list = (items) =>
      items
        .map(
          ({ item, qty }) => `
          <li>
            <span class="extra-media">${mediaHtml(item)}</span>
            <span>${escapeHtml(item.name)}</span>
            <span class="pkg-qty">${qty}×</span>
          </li>`
        )
        .join("");
    return `
      <h3>Paketinizin özeti</h3>
      <dl class="builder-facts">
        <div><dt>Ev</dt><dd>${escapeHtml(sizeOf(state.size).label)}${escapeHtml(balconyText(state.balconies, ", "))} <button type="button" class="link-button" data-goto="0">Değiştir</button></dd></div>
        <div><dt>Isıtma</dt><dd>${escapeHtml(heatingOf(state.heating).name)} <button type="button" class="link-button" data-goto="1">Değiştir</button></dd></div>
      </dl>
      ${withItems
        .map(
          (room) => `
        <h4 class="list-title"><button type="button" class="link-button" data-room="${room.id}">${escapeHtml(room.label)}</button></h4>
        <ul class="pkg-items">${list(room.items)}</ul>`
        )
        .join("")}
      ${unplaced.length ? `<h4 class="list-title">Odası seçilmemiş</h4><ul class="pkg-items">${list(unplaced)}</ul>` : ""}
      <p><button type="button" class="link-button" data-goto="3">Ürün ekle veya çıkar</button></p>
      <div class="builder-total">
        <div><span>Paket fiyatı</span><strong>${formatMoney(toCents(pkg.price))}</strong></div>
        <div class="muted"><span>Şimdi ödenecek kapora (%${Math.round(settings.payment.depositRate * 100)})</span><span>${formatMoney(depositCents(pkg))}</span></div>
      </div>
      <p class="fine-print">${icon("check")}<span>Fiyata ürünler, elektrikçi ve kurulum hizmeti, ulaşım, garanti ve %20 KDV dahildir. Ürünlerin odalara yerleşimi kurulum öncesi görüşmede birlikte netleşir. Kapora sonraki adımda havale/EFT ile ödenir.</span></p>
      <div class="builder-nav">
        <button type="button" class="btn btn-secondary" data-goto="3">← Geri</button>
        <button type="button" class="btn btn-primary" data-finish>${ownPackage ? "Paketimi güncelle ve devam et" : "Bu paketi seç ve devam et"} →</button>
      </div>`;
  }

  function rowHtml(p, min, tag = min ? "Zorunlu" : "") {
    const id = escapeHtml(p.id);
    const name = escapeHtml(p.name);
    const qty = qtyOf(p.id);
    return `
      <li class="builder-item${qty ? " is-on" : ""}">
        <span class="extra-media">${mediaHtml(p)}</span>
        <div class="builder-item-info">
          <strong>${name}</strong>${tag ? ` <span class="tag${min ? " tag-required" : ""}">${tag}</span>` : ""}
          <span class="muted">${escapeHtml(p.description)}</span>
          ${roomsLine(p.id)}
        </div>
        <div class="stepper stepper-sm" role="group" aria-label="${name}: adet">
          <button type="button" data-bqty="${id}" data-delta="-1" data-focus-key="bdec-${id}" aria-label="Bir azalt" ${qty <= min ? "disabled" : ""}>−</button>
          <output>${qty}</output>
          <button type="button" data-bqty="${id}" data-delta="1" data-focus-key="binc-${id}" aria-label="Bir artır" ${qty >= CUSTOM_MAX_QTY ? "disabled" : ""}>+</button>
        </div>
      </li>`;
  }

  function summaryHtml() {
    const { total } = customPrice(state.items);
    const count = state.items.reduce((sum, i) => sum + i.qty, 0);
    return `
      <aside class="builder-summary" aria-live="polite">
        <p class="cart-line-kind">Kendi paketiniz</p>
        <p class="muted">${escapeHtml(heatingOf(state.heating).name)}</p>
        <p class="builder-price">${formatMoney(toCents(total))}</p>
        <p class="muted">${count} ürün · kurulum, ulaşım, garanti ve KDV dahil</p>
        ${state.step < 4 ? `<button type="button" class="btn btn-primary btn-block" data-goto="4">Özete geç</button>` : ""}
      </aside>`;
  }

  function openRoom(id) {
    if (!canEditRooms()) return;
    state.room = id;
    draw();
    const top = panelEl.getBoundingClientRect().top;
    const covered = sideEl.getBoundingClientRect().bottom; // on phones the plan is pinned above the panel
    if (top < covered || top > window.innerHeight * 0.6) {
      window.scrollBy({ top: top - Math.max(covered, 80) - 8, behavior: "smooth" });
    }
  }

  // ── Clicks ────────────────────────────────────────────────────────────────
  root.addEventListener("click", (e) => {
    const goto = e.target.closest("[data-goto]");
    const size = e.target.closest("[data-size]");
    const heating = e.target.closest("[data-heating]");
    const balconies = e.target.closest("[data-balconies]");
    const roomEl = e.target.closest("[data-room]");
    const qty = e.target.closest("[data-bqty]");
    const rqty = e.target.closest("[data-rqty]");
    if (e.target.closest("[data-toggle-plan]")) {
      const collapsed = sideEl.classList.toggle("is-collapsed");
      const button = e.target.closest("[data-toggle-plan]");
      button.textContent = collapsed ? "Krokiyi göster" : "Krokiyi gizle";
      button.setAttribute("aria-expanded", String(!collapsed));
      return;
    }
    if (rqty) {
      changeInRoom(state.room, rqty.dataset.rqty, Number(rqty.dataset.delta));
      draw();
      return;
    }
    if (roomEl) {
      openRoom(roomEl.dataset.room);
      return;
    }
    if (e.target.closest("[data-close-room]")) {
      state.room = null;
      draw();
      root.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    if (balconies) {
      const first = state.balconies === null;
      chooseBalconies(Number(balconies.dataset.balconies));
      if (first) state.step = 1; // first answer: go on to heating
      draw();
      if (first) root.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    if (goto) {
      state.room = null;
      state.step = Math.max(0, Math.min(Number(goto.dataset.goto), maxStep()));
      draw();
      root.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    if (size) {
      chooseSize(size.dataset.size);
      draw();
      if (sizeOf(state.size).large) planning.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    if (heating) {
      chooseHeating(heating.dataset.heating);
      draw();
      root.scrollIntoView({ block: "start", behavior: "smooth" });
      return;
    }
    if (qty) {
      setQty(qty.dataset.bqty, qtyOf(qty.dataset.bqty) + Number(qty.dataset.delta));
      draw();
      return;
    }
    if (e.target.closest("[data-finish]")) {
      setCustom(custom());
      location.href = "/cart.html";
    }
  });

  // Rooms on the plan work with the keyboard too.
  root.addEventListener("keydown", (e) => {
    const roomEl = e.target.closest?.(".floor-plan [data-room]");
    if (roomEl && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      openRoom(roomEl.dataset.room);
    }
  });

  draw();
}
