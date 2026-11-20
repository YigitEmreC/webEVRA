// "Kendi paketini oluştur" on the Packages page (#builder), step by step:
//   1 Ev büyüklüğü → 2 Isıtma sistemi → 3 Sistem (required products, filled in
//   automatically) → 4 Ürünler (any product, any quantity) → 5 Özet ve fiyat.
// "5+1 ve üzeri" doesn't build a package: it opens the planning form (#planning).
// The price is calculated live (builder-core.js → customPrice, settings.js → pricing).
// The draft is kept in this browser (localStorage "builder.v1") until it is chosen;
// then it becomes the order's own package (cart-store.js → setCustom).

import { products } from "../../data/catalog.js";
import { homeSizes, heatingSystems } from "../../data/builder.js";
import { findItem, formatMoney, toCents, depositCents } from "./pricing.js";
import { CUSTOM_ID, CUSTOM_MAX_QTY, sizeOf, heatingOf, requiredItems, minQty, startItems, customPrice, customPackage } from "./builder-core.js";
import { getOrder, setCustom } from "./cart-store.js";
import { settings } from "../../data/settings.js";
import { escapeHtml, icon, mediaHtml } from "./ui.js";

const KEY = "builder.v1";
const STEPS = ["Ev büyüklüğü", "Isıtma", "Sistem", "Ürünler", "Özet"];

function loadDraft() {
  const order = getOrder();
  if (order.custom) return { step: 4, ...order.custom };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") {
      return {
        step: Math.min(Math.max(Number(saved.step) || 0, 0), 4),
        size: sizeOf(saved.size)?.id || null,
        heating: heatingOf(saved.heating)?.id || null,
        items: Array.isArray(saved.items) ? saved.items.filter((i) => findItem(i?.id) && i.qty > 0) : [],
      };
    }
  } catch {
    /* storage blocked or broken: start fresh */
  }
  return { step: 0, size: null, heating: null, items: [] };
}

export function initBuilder() {
  const root = document.getElementById("builder");
  if (!root) return;
  const planning = document.getElementById("planning");

  let state = loadDraft();
  // A step can only be shown when the earlier choices are made.
  const maxStep = () => (!state.size || sizeOf(state.size).large ? 0 : !state.heating ? 1 : 4);
  state.step = Math.min(state.step, maxStep());

  const save = () => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* not saved; fine */
    }
  };
  const qtyOf = (id) => state.items.find((i) => i.id === id)?.qty || 0;
  const custom = () => ({ size: state.size, heating: state.heating, items: state.items });

  function setQty(id, qty) {
    const n = Math.max(minQty(custom(), id), Math.min(qty, CUSTOM_MAX_QTY));
    const exists = state.items.some((i) => i.id === id);
    state.items = n
      ? exists
        ? state.items.map((i) => (i.id === id ? { id, qty: n } : i))
        : [...state.items, { id, qty: n }]
      : state.items.filter((i) => i.id !== id);
  }

  function chooseSize(id) {
    const before = state.size;
    state.size = id;
    if (sizeOf(id).large) return;
    // Per-room products (valves, actuators) follow the new room count.
    if (before && state.heating && before !== id) {
      const oldRooms = sizeOf(before)?.rooms;
      for (const r of heatingOf(state.heating).items.filter((i) => i.qty === "rooms")) {
        if (!sizeOf(before)?.large && qtyOf(r.id) === oldRooms) setQty(r.id, sizeOf(id).rooms);
      }
    }
    state.step = 1;
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
    for (const s of startItems(state.size, id)) {
      if (qtyOf(s.id) < s.qty) setQty(s.id, s.qty);
    }
    state.step = 2;
  }

  // ── Drawing ───────────────────────────────────────────────────────────────
  function draw() {
    const focusKey = document.activeElement?.dataset?.focusKey;
    const large = state.size && sizeOf(state.size).large;
    const ownPackage = getOrder().package === CUSTOM_ID;
    const showSummary = state.step >= 2 && !large;

    root.innerHTML = `
      <ol class="builder-steps">
        ${STEPS.map(
          (label, i) => `
          <li class="${i === state.step ? "is-current" : i < state.step ? "is-done" : ""}">
            <button type="button" data-goto="${i}" ${i > maxStep() ? "disabled" : ""} ${i === state.step ? 'aria-current="step"' : ""}>
              <span class="step-num">${i < state.step ? icon("check") : i + 1}</span><span class="step-label">${label}</span>
            </button>
          </li>`
        ).join("")}
      </ol>
      <div class="builder-layout${showSummary ? " has-summary" : ""}">
        <div class="builder-panel">${[stepSize, stepHeating, stepSystem, stepProducts, stepSummary][state.step](ownPackage)}</div>
        ${showSummary ? summaryHtml() : ""}
      </div>`;

    planning.hidden = !large;
    if (large) {
      const select = planning.querySelector("[name=size]");
      if (select && !select.value) select.value = "5+1";
    }
    if (focusKey) root.querySelector(`[data-focus-key="${focusKey}"]`)?.focus();
    save();
  }

  function navHtml({ back = true, next = null, nextLabel = "Devam et" } = {}) {
    return `
      <div class="builder-nav">
        ${back ? `<button type="button" class="btn btn-secondary" data-goto="${state.step - 1}">← Geri</button>` : "<span></span>"}
        ${next !== null ? `<button type="button" class="btn btn-primary" data-goto="${next}">${nextLabel} →</button>` : ""}
      </div>`;
  }

  function stepSize() {
    const large = state.size && sizeOf(state.size).large;
    return `
      <h3>Eviniz kaç oda?</h3>
      <p class="muted">Oda sayısına göre ısıtma ürünlerinin adedini sizin için hazırlıyoruz.</p>
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
        large
          ? `<div class="notice-inline">${icon("layers")}<span><strong>Büyük evler için birlikte planlama yapıyoruz.</strong> 5+1 ve daha büyük evlerde ihtiyaçlar çok farklı olduğu için hazır fiyat vermiyoruz. Aşağıdaki planlama formunu doldurun, sizi arayıp evinize özel bir plan ve teklif hazırlayalım.</span></div>`
          : ""
      }`;
  }

  function stepHeating() {
    return `
      <h3>Isıtma sisteminiz nedir?</h3>
      <p class="muted">Seçiminize göre gerekli ısıtma ürünleri paketinize otomatik eklenir. Bu adım zorunludur.</p>
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
      <p class="muted">Sistemin çalışması için gereken ürünleri sizin için ekledik. Zorunlu ürünler en az bir adet kalır; adetleri değiştirebilirsiniz.</p>
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
      <p class="muted">İstediğiniz ürünü istediğiniz adette ekleyin. Fiyat her değişiklikte güncellenir.</p>
      ${[...groups]
        .map(
          ([category, list]) => `
        <h4 class="list-title">${escapeHtml(category)}</h4>
        <ul class="builder-items">${list.map((p) => rowHtml(p, 0)).join("")}</ul>`
        )
        .join("")}
      ${navHtml({ next: 4, nextLabel: "Özete geç" })}`;
  }

  function stepSummary(ownPackage) {
    const items = state.items.map((i) => ({ item: findItem(i.id), qty: i.qty })).filter((x) => x.item);
    const pkg = customPackage(custom());
    return `
      <h3>Paketinizin özeti</h3>
      <dl class="builder-facts">
        <div><dt>Ev</dt><dd>${escapeHtml(sizeOf(state.size).label)} <button type="button" class="link-button" data-goto="0">Değiştir</button></dd></div>
        <div><dt>Isıtma</dt><dd>${escapeHtml(heatingOf(state.heating).name)} <button type="button" class="link-button" data-goto="1">Değiştir</button></dd></div>
      </dl>
      <ul class="pkg-items">
        ${items
          .map(
            ({ item, qty }) => `
          <li>
            <span class="extra-media">${mediaHtml(item)}</span>
            <span>${escapeHtml(item.name)}</span>
            <span class="pkg-qty">${qty}×</span>
          </li>`
          )
          .join("")}
      </ul>
      <p><button type="button" class="link-button" data-goto="3">Ürün ekle veya çıkar</button></p>
      <div class="builder-total">
        <div><span>Paket fiyatı</span><strong>${formatMoney(toCents(pkg.price))}</strong></div>
        <div class="muted"><span>Şimdi ödenecek kapora (%${Math.round(settings.payment.depositRate * 100)})</span><span>${formatMoney(depositCents(pkg))}</span></div>
      </div>
      <p class="fine-print">${icon("check")}<span>Fiyata ürünler, elektrikçi ve kurulum hizmeti, ulaşım, garanti ve %20 KDV dahildir. Kapora sonraki adımda havale/EFT ile ödenir; kalan tutar ve kurulum tarihi sizi aradığımızda netleşir.</span></p>
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
        <p class="muted">${escapeHtml(sizeOf(state.size).label)} · ${escapeHtml(heatingOf(state.heating).name)}</p>
        <p class="builder-price">${formatMoney(toCents(total))}</p>
        <p class="muted">${count} ürün · kurulum, ulaşım, garanti ve KDV dahil</p>
        ${state.step < 4 ? `<button type="button" class="btn btn-primary btn-block" data-goto="4">Özete geç</button>` : ""}
      </aside>`;
  }

  // ── Clicks ────────────────────────────────────────────────────────────────
  root.addEventListener("click", (e) => {
    const goto = e.target.closest("[data-goto]");
    const size = e.target.closest("[data-size]");
    const heating = e.target.closest("[data-heating]");
    const qty = e.target.closest("[data-bqty]");
    if (goto) {
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

  draw();
}
