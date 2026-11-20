// "Kendi paketini oluştur" on the Packages page (#builder), step by step:
//   1 Ev (oda + balkon) → 2 Isıtma → 3 Sorular (one yes/no question at a time;
//   every "Evet" adds the suggested products, sized to the home) → 4 Krokiniz
//   (the products sit in the rooms of the floor plan; tap a room to change it)
//   → 5 Özet ve fiyat.
// From step 1 on, a bird's-eye floor plan (floor-plan.js) stays beside the steps
// (on phones: pinned at the top), with "Ürünleriniz ne yapıyor?" under it. On
// computers the room editor opens under the plan (the page doesn't move); on
// phones it takes the place of the step. Tapping a product emblem on the plan
// (or a line of "Ürünleriniz ne yapıyor?") opens an info card in the left
// column: what it does and which automations it makes possible.
// Rules and data: builder-core.js and data/builder.js. Price: customPrice.
// "5+1 ve üzeri" doesn't build a package: it opens the planning form (#planning).
// The draft lives in sessionStorage ("builder.v1"): it survives going to another
// page, coming back and reloading, but a new visit starts from scratch. Once
// chosen it becomes the order's own package (cart-store.js → setCustom); that one
// is kept between visits and is only loaded into the builder on request
// ("Paketimi düzenle" links use ?duzenle=1, or the "saved package" notice).

import { products } from "../../data/catalog.js";
import { homeSizes, heatingKinds, questions, roomProducts } from "../../data/builder.js";
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
  cleanAnswers,
  roomsOf,
  normalizePlacements,
  placedQty,
  autoPlace,
  roomSummary,
  applyAnswer,
  buildFromAnswers,
  SINGLE_ITEMS,
} from "./builder-core.js";
import { floorPlanSvg, emblemsSvg, categoryIcon } from "./floor-plan.js";
import { getOrder, setCustom } from "./cart-store.js";
import { settings } from "../../data/settings.js";
import { escapeHtml, icon, toast, typeTileHtml } from "./ui.js";

const KEY = "builder.v1";
const STEPS = ["Ev", "Isıtma", "Sorular", "Krokiniz", "Özet"];

const FRESH = () => ({ step: 0, q: 0, room: null, info: null, size: null, balconies: null, heating: null, items: [], placements: {}, answers: {}, chosen: false });
const fromOrder = (custom) => ({ ...FRESH(), step: 4, q: questions.length, ...custom, answers: cleanAnswers(custom.answers), chosen: true });

function loadDraft() {
  const order = getOrder();
  try {
    localStorage.removeItem(KEY); // drafts used to be kept forever; not any more
  } catch {
    /* storage blocked */
  }
  // "Paketimi düzenle" (from Siparişim / Ürünler): open the saved package.
  if (new URLSearchParams(location.search).has("duzenle") && order.custom) return fromOrder(order.custom);
  try {
    const saved = JSON.parse(sessionStorage.getItem(KEY) || "null");
    if (saved && typeof saved === "object") {
      // Chosen in this visit and maybe changed on the Products page since: the order is newer.
      if (saved.chosen && order.custom) return fromOrder(order.custom);
      return {
        ...FRESH(),
        step: Math.min(Math.max(Number(saved.step) || 0, 0), 4),
        q: Math.min(Math.max(Number(saved.q) || 0, 0), questions.length),
        size: sizeOf(saved.size)?.id || null,
        balconies: cleanBalconies(saved),
        heating: heatingOf(saved.heating)?.id || null,
        items: Array.isArray(saved.items) ? saved.items.filter((i) => findItem(i?.id) && i.qty > 0) : [],
        placements: saved.placements && typeof saved.placements === "object" ? saved.placements : {},
        answers: cleanAnswers(saved.answers),
      };
    }
  } catch {
    /* storage blocked or broken: start fresh */
  }
  return FRESH();
}

/** Small round icon of a product's category, like the emblems on the plan. */
const emblemIcon = (p) => `<span class="room-emblem" aria-hidden="true"><svg viewBox="0 0 24 24">${categoryIcon(p.category)}</svg></span>`;

/** The heating kind (Kombi, Merkezi …) a heating system belongs to. */
const kindOf = (heating) => heatingKinds.find((k) => k.system === heating || Object.values(k.floor || {}).includes(heating)) || null;

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
      const { room, info, ...rest } = state;
      sessionStorage.setItem(KEY, JSON.stringify(rest));
    } catch {
      /* not saved; fine */
    }
  };
  const qtyOf = (id) => state.items.find((i) => i.id === id)?.qty || 0;
  const custom = () => ({ size: state.size, balconies: state.balconies, heating: state.heating, items: state.items, placements: state.placements, answers: state.answers });
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
        <div data-room-side></div>
        <div data-does-side></div>
        <div data-summary></div>
      </aside>
    </div>
    <div class="builder-mobilebar" data-mobilebar hidden></div>`;
  const stepsEl = root.querySelector("[data-steps]");
  const panelEl = root.querySelector("[data-panel]");
  const sideEl = root.querySelector("[data-side]");
  const planEl = root.querySelector("[data-plan]");
  const hintEl = root.querySelector("[data-plan-hint]");
  const summaryEl = root.querySelector("[data-summary]");
  const roomSideEl = root.querySelector("[data-room-side]");
  const doesSideEl = root.querySelector("[data-does-side]");
  const mobileBarEl = root.querySelector("[data-mobilebar]");
  const phone = window.matchMedia("(max-width: 899px)");
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

  /** The home changed after the heating was chosen: suggest again for the new home. */
  function rebuild() {
    if (!state.heating || !state.size || sizeOf(state.size).large || state.balconies === null) return;
    const hadProducts = state.items.length > 0;
    Object.assign(state, buildFromAnswers(state.size, state.balconies, state.heating, state.answers));
    if (hadProducts) toast("Öneriler yeni evinize göre güncellendi");
  }

  function chooseSize(id) {
    const changed = state.size !== id;
    state.size = id;
    if (sizeOf(id).large) {
      state.room = null;
      return;
    }
    if (changed) rebuild();
    normalize();
    if (state.room && !rooms().some((r) => r.id === state.room)) state.room = null;
  }

  function chooseBalconies(n) {
    const changed = state.balconies !== n;
    state.balconies = n;
    if (changed) rebuild();
    normalize();
    if (state.room && !rooms().some((r) => r.id === state.room)) state.room = null;
  }

  function chooseHeating(id) {
    if (state.heating === id) return;
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
  }

  function answer(questionId, yes) {
    Object.assign(state, applyAnswer(custom(), questionId, yes));
    const index = questions.findIndex((q) => q.id === questionId);
    const asked = state.q === index; // answered the question on screen (not in the overview)
    if (asked) state.q = index + 1;
    if (asked && state.q >= questions.length) state.step = 3; // last question → the plan
  }

  // ── Drawing ───────────────────────────────────────────────────────────────
  function draw() {
    const focusKey = document.activeElement?.dataset?.focusKey;
    const large = state.size && sizeOf(state.size).large;
    const ownPackage = getOrder().package === CUSTOM_ID;
    const showSummary = state.step >= 2 && !large;
    if (state.room && !canEditRooms()) state.room = null;
    const editorInSide = Boolean(state.room) && !phone.matches;
    const editorInPanel = Boolean(state.room) && phone.matches;

    stepsEl.innerHTML = `
        ${STEPS.map(
          (label, i) => `
          <li class="${i === state.step && !editorInPanel ? "is-current" : i < state.step ? "is-done" : ""}">
            <button type="button" data-goto="${i}" ${i > maxStep() ? "disabled" : ""} ${i === state.step ? 'aria-current="step"' : ""}>
              <span class="step-num">${i < state.step ? icon("check") : i + 1}</span><span class="step-label">${label}</span>
            </button>
          </li>`
        ).join("")}`;
    panelEl.innerHTML =
      (state.info ? infoHtml(state.info) : "") +
      (editorInPanel ? roomEditor() : [stepHome, stepHeating, stepQuestions, stepPlan, stepSummary][state.step](ownPackage));
    roomSideEl.innerHTML = editorInSide ? roomEditor(true) : "";
    doesSideEl.innerHTML = !phone.matches && !editorInSide && state.step >= 2 && !large ? doesHtml() : "";
    sideEl.classList.toggle("is-editing", editorInSide);
    sideEl.hidden = Boolean(large);
    summaryEl.innerHTML = showSummary && !editorInSide ? summaryHtml() : "";
    mobileBarEl.hidden = !(phone.matches && showSummary);
    if (!mobileBarEl.hidden) mobileBarEl.innerHTML = mobileBarHtml();
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
    const { html, filled } = emblemsSvg({ bedrooms: size.bedrooms, balconies: state.balconies || 0 }, state.placements, findItem, { size: phone.matches ? 24 : 18 });
    const svg = planEl.querySelector(".floor-plan");
    svg.querySelector("[data-emblems]").innerHTML = html;
    svg.querySelectorAll(".fp-room[data-room]").forEach((g) => {
      g.classList.toggle("has-items", filled.includes(g.dataset.room));
      g.classList.toggle("is-selected", g.dataset.room === state.room);
    });
    svg.classList.toggle("is-locked", !canEditRooms());
    hintEl.textContent =
      state.balconies === null
        ? `${size.label} · balkon sayısını seçin`
        : !canEditRooms()
          ? `${size.label}${balconyText(state.balconies, " · ")}`
          : state.room
            ? `${rooms().find((r) => r.id === state.room)?.label || ""} düzenleniyor`
            : "Bir odaya dokunun, ürün ekleyin ya da çıkarın";
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

  /** On a fresh start, a package made on an earlier visit can be reopened. */
  function savedNotice() {
    const order = getOrder();
    if (state.chosen || state.size || !order.custom) return "";
    const pkg = customPackage(order.custom);
    if (!pkg) return "";
    return `
      <div class="notice-inline saved-pkg">${icon("layers")}<span>Kayıtlı paketiniz var: <strong>${escapeHtml(pkg.context)}</strong>, ${formatMoney(toCents(pkg.price))}.
        <button type="button" class="link-button" data-load-saved>Onu düzenle</button></span></div>`;
  }

  // ── Steps ─────────────────────────────────────────────────────────────────
  function stepHome() {
    const large = state.size && sizeOf(state.size).large;
    return `
      ${savedNotice()}
      <h3>Eviniz kaç oda?</h3>
      <div class="choice-row">
        ${homeSizes
          .map((s) => `<button type="button" class="choice choice-compact" data-size="${escapeHtml(s.id)}" aria-pressed="${state.size === s.id}"><strong>${escapeHtml(s.label)}</strong></button>`)
          .join("")}
      </div>
      ${
        state.size && !large
          ? `
        <h3 class="builder-q">Kaç balkonunuz var?</h3>
        <div class="choice-row">
          ${Array.from({ length: MAX_BALCONIES + 1 }, (_, n) => n)
            .map((n) => `<button type="button" class="choice choice-compact" data-balconies="${n}" aria-pressed="${state.balconies === n}"><strong>${n === 0 ? "Yok" : n}</strong></button>`)
            .join("")}
        </div>
        ${navHtml({ back: false, next: state.balconies === null ? null : 1 })}`
          : ""
      }
      ${
        large
          ? `<div class="notice-inline">${icon("layers")}<span><strong>Büyük evleri birlikte planlıyoruz.</strong> Aşağıdaki formu doldurun, sizi arayalım.</span></div>`
          : ""
      }`;
  }

  function stepHeating() {
    const kind = kindOf(state.heating);
    return `
      <h3>Eviniz nasıl ısınıyor?</h3>
      <div class="choice-grid choice-grid-heat">
        ${heatingKinds
          .map(
            (k) => `
          <button type="button" class="choice" data-kind="${escapeHtml(k.id)}" aria-pressed="${kind?.id === k.id}">
            <strong>${escapeHtml(k.name)}</strong>
            <span class="muted">${escapeHtml(k.text)}</span>
          </button>`
          )
          .join("")}
      </div>
      ${
        kind?.floor
          ? `
        <h3 class="builder-q">Petek mi, yerden ısıtma mı?</h3>
        <div class="choice-row">
          <button type="button" class="choice choice-compact" data-heating="${kind.floor.petek}" aria-pressed="${state.heating === kind.floor.petek}"><strong>Petek</strong></button>
          <button type="button" class="choice choice-compact" data-heating="${kind.floor.yerden}" aria-pressed="${state.heating === kind.floor.yerden}"><strong>Yerden ısıtma</strong></button>
        </div>`
          : ""
      }
      ${navHtml({ next: state.heating ? 2 : null })}`;
  }

  /** Product names a question would add, with the category icons. */
  function questionPreview(q) {
    const seen = new Set();
    return q.items
      .filter((i) => !seen.has(i.id) && seen.add(i.id))
      .map((i) => findItem(i.id))
      .filter(Boolean)
      .map((p) => `<li>${emblemIcon(p)}${escapeHtml(p.name)}</li>`)
      .join("");
  }

  function stepQuestions() {
    const n = questions.length;
    if (state.q >= n) {
      // All answered: an overview where any answer can be changed.
      return `
        <h3>Cevaplarınız</h3>
        <ul class="answer-list">
          ${questions
            .map(
              (q) => `
            <li>
              <span>${escapeHtml(q.title)}</span>
              <span class="answer-toggle" role="group" aria-label="${escapeHtml(q.title)}">
                <button type="button" data-answer="${q.id}" data-yes="1" aria-pressed="${state.answers[q.id] === true}">Evet</button>
                <button type="button" data-answer="${q.id}" data-yes="0" aria-pressed="${state.answers[q.id] === false}">Hayır</button>
              </span>
            </li>`
            )
            .join("")}
        </ul>
        ${navHtml({ next: 3, nextLabel: "Krokime bak" })}`;
    }
    const q = questions[state.q];
    return `
      <div class="question">
        <div class="question-progress" aria-hidden="true"><span style="width:${Math.round((state.q / n) * 100)}%"></span></div>
        <p class="question-count">Soru ${state.q + 1} / ${n}</p>
        <h3>${escapeHtml(q.title)}</h3>
        <p class="muted">${escapeHtml(q.hint)}</p>
        <ul class="question-preview">${questionPreview(q)}</ul>
        <div class="question-answers">
          <button type="button" class="btn btn-primary" data-answer="${q.id}" data-yes="1" aria-pressed="${state.answers[q.id] === true}">Evet, ekle</button>
          <button type="button" class="btn btn-secondary" data-answer="${q.id}" data-yes="0" aria-pressed="${state.answers[q.id] === false}">Hayır</button>
        </div>
        <div class="builder-nav">
          <button type="button" class="link-button" data-prev-q>← ${state.q ? "Önceki soru" : "Isıtma"}</button>
          <button type="button" class="link-button" data-skip-q>Soruları atla</button>
        </div>
      </div>`;
  }

  function stepPlan() {
    return `
      <h3>Krokiniz hazır</h3>
      <ul class="tick-list">
        <li>${icon("check")}Önerdiğimiz ürünler odalara yerleşti.</li>
        <li>${icon("check")}Değiştirmek için bir odaya dokunun.</li>
      </ul>
      ${roomChips()}
      ${phone.matches ? doesHtml() : ""}
      ${navHtml({ next: 4, nextLabel: "Özete geç" })}`;
  }

  function stepSummary(ownPackage) {
    const pkg = customPackage(custom());
    const { rooms: withItems, unplaced } = roomSummary(custom());
    const list = (items) =>
      items
        .map(
          ({ item, qty }) => `
          <li>
            ${typeTileHtml(item)}
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
      <div class="builder-total">
        <div><span>Paket fiyatı</span><strong>${formatMoney(toCents(pkg.price))}</strong></div>
        <div class="muted"><span>Şimdi ödenecek kapora (%${Math.round(settings.payment.depositRate * 100)})</span><span>${formatMoney(depositCents(pkg))}</span></div>
      </div>
      <ul class="tick-list tick-list-small">
        <li>${icon("check")}Kurulum, elektrikçi, ulaşım, garanti ve KDV dahil</li>
        <li>${icon("check")}Güncellemeler geceleri otomatik: 2026'da çalışan sisteminiz 2027'de de çalışır</li>
        <li>${icon("check")}Kapora havale/EFT ile; kalan tutar ve kurulum günü telefonda netleşir</li>
      </ul>
      <div class="builder-nav">
        <button type="button" class="btn btn-secondary" data-goto="3">← Geri</button>
        <button type="button" class="btn btn-primary" data-finish>${ownPackage ? "Paketimi güncelle ve devam et" : "Bu paketi seç ve devam et"} →</button>
      </div>`;
  }

  /** "Ürünleriniz ne yapıyor?": one short line per product (under the plan). */
  /** Info card: what a product does, where it is, and automations it allows. */
  function infoHtml(id) {
    const p = findItem(id);
    if (!p) return "";
    const qty = qtyOf(id);
    const where = rooms()
      .filter((r) => roomQty(r.id, id))
      .map((r) => `${r.label}${roomQty(r.id, id) > 1 ? ` (${roomQty(r.id, id)})` : ""}`);
    const bullets = (list) => list.map((x) => `<li>${icon("check")}<span>${escapeHtml(x)}</span></li>`).join("");
    return `
      <div class="product-info" role="dialog" aria-label="${escapeHtml(p.name)}">
        <div class="product-info-head">
          ${typeTileHtml(p)}
          <div>
            <h3>${escapeHtml(p.name)}</h3>
            <p class="muted">${qty ? `Paketinizde ${qty} adet${where.length ? ` · ${escapeHtml(where.join(", "))}` : ""}` : escapeHtml(p.category)}</p>
          </div>
          <button type="button" class="link-button product-info-close" data-close-info aria-label="Kapat">✕</button>
        </div>
        <p>${escapeHtml(p.description)}</p>
        ${p.features?.length ? `<p class="list-title">Ne işe yarar?</p><ul class="tick-list">${bullets(p.features)}</ul>` : ""}
        ${p.uses?.length ? `<p class="list-title">Olası otomasyonlar</p><ul class="tick-list tick-list-auto">${bullets(p.uses)}</ul>` : ""}
      </div>`;
  }

  function doesHtml() {
    const required = new Set(requiredItems(state.size, state.heating).filter((r) => r.min > 0).map((r) => r.id));
    const order = products.map((p) => p.id);
    const items = [...state.items].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
    if (!items.length) return "";
    return `
      <div class="does">
        <p class="cart-line-kind">Ürünleriniz ne yapıyor?</p>
        <ul class="does-list">
          ${items
            .map(({ id, qty }) => {
              const p = findItem(id);
              if (!p) return "";
              return `
            <li class="does-item" data-product="${escapeHtml(id)}" tabindex="0" role="button" aria-label="${escapeHtml(p.name)}: ne işe yarar?">
              ${emblemIcon(p)}
              <span class="does-text">
                <span class="does-name"><strong>${escapeHtml(p.name)}</strong>${qty > 1 ? ` <span class="does-qty">×${qty}</span>` : ""}${required.has(id) ? ` <span class="tag">Sistem</span>` : ""}</span>
                <span class="muted">${escapeHtml(p.description)}</span>
              </span>
            </li>`;
            })
            .join("")}
        </ul>
      </div>`;
  }

  function roomEditor(inSide = false) {
    const room = rooms().find((r) => r.id === state.room);
    const offer = (p) => p && !SINGLE_ITEMS.includes(p.id); // the main system stays put (one per home)
    const here = Object.keys(state.placements[room.id] || {}).map(findItem).filter(offer);
    const hereIds = new Set(here.map((p) => p.id));
    const suggested = (roomProducts[room.kind] || []).filter((id) => !hereIds.has(id)).map(findItem).filter(offer);
    const shownIds = new Set([...hereIds, ...suggested.map((p) => p.id)]);
    const others = products.filter((p) => offer(p) && !shownIds.has(p.id));
    return `
      <div class="room-editor${inSide ? " in-side" : ""}">
        ${
          inSide
            ? `<div class="room-editor-head"><h3>${escapeHtml(room.label)}</h3><button type="button" class="link-button" data-close-room>Kapat ✕</button></div>
               <p class="room-editor-price">Paket fiyatı <strong>${formatMoney(toCents(customPrice(state.items).total))}</strong></p>`
            : `<button type="button" class="link-button" data-close-room>← ${STEPS[state.step]} adımına dön</button>
               <h3>${escapeHtml(room.label)}</h3>`
        }
        ${roomChips()}
        ${here.length ? `<h4 class="list-title">Bu odada</h4><ul class="builder-items">${here.map((p) => roomRowHtml(p, room.id)).join("")}</ul>` : ""}
        ${suggested.length ? `<h4 class="list-title">Bu odaya önerilenler</h4><ul class="builder-items">${suggested.map((p) => roomRowHtml(p, room.id)).join("")}</ul>` : ""}
        <details class="room-group">
          <summary>Diğer ürünler <span class="muted">(${others.length})</span></summary>
          <ul class="builder-items">${others.map((p) => roomRowHtml(p, room.id)).join("")}</ul>
        </details>
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
        ${typeTileHtml(p)}
        <div class="builder-item-info">
          <strong>${emblemIcon(p)}${name}</strong>
          <span class="muted">${escapeHtml(p.description)}</span>
        </div>
        <div class="stepper stepper-sm" role="group" aria-label="${name}: bu odada adet">
          <button type="button" data-rqty="${id}" data-delta="-1" data-focus-key="rdec-${id}" aria-label="Bu odadan bir azalt" ${qty <= 0 ? "disabled" : ""}>−</button>
          <output>${qty}</output>
          <button type="button" data-rqty="${id}" data-delta="1" data-focus-key="rinc-${id}" aria-label="Bu odaya bir ekle" ${full ? "disabled" : ""}>+</button>
        </div>
      </li>`;
  }

  function summaryHtml() {
    const { total } = customPrice(state.items);
    const count = state.items.reduce((sum, i) => sum + i.qty, 0);
    return `
      <aside class="builder-summary" aria-live="polite">
        <p class="cart-line-kind">Kendi paketiniz</p>
        <p class="muted">${count} ürün · kurulum ve KDV dahil</p>
        <p class="builder-price">${formatMoney(toCents(total))}</p>
        ${state.step < 4 ? `<button type="button" class="btn btn-primary btn-block" data-goto="4">Özete geç</button>` : ""}
      </aside>`;
  }

  const headerBottom = () => document.querySelector(".site-header")?.getBoundingClientRect().bottom || 70;

  /** Brings the info card into view if it is off screen (it sits at the top of the left column). */
  function revealInfo() {
    const card = panelEl.querySelector(".product-info");
    if (!card) return;
    const covered = headerBottom();
    const { top, bottom } = card.getBoundingClientRect();
    if (top >= covered - 4 && bottom <= window.innerHeight) return;
    window.scrollBy({ top: top - covered - 8, behavior: "smooth" });
  }

  /** Phones: price always at the bottom of the screen, and a way back up to the plan. */
  function mobileBarHtml() {
    const { total } = customPrice(state.items);
    const count = state.items.reduce((sum, i) => sum + i.qty, 0);
    return `
      <button type="button" class="mobilebar-plan" data-show-plan>${icon("layers")}<span>Kroki</span></button>
      <p><strong>${formatMoney(toCents(total))}</strong><span>${count} ürün · kurulum ve KDV dahil</span></p>
      ${state.step < 4 ? `<button type="button" class="btn btn-primary" data-goto="4">Özet</button>` : ""}`;
  }

  function openRoom(id) {
    if (!canEditRooms()) return;
    state.room = id;
    draw();
    revealPanel();
  }

  /**
   * Phones only: the step / room editor sits under the plan. Scroll only when its
   * top is hidden behind the header or far below; otherwise stay put.
   * (On computers nothing moves: the room editor opens under the plan.)
   */
  function revealPanel() {
    if (!phone.matches) return;
    const covered = headerBottom();
    const top = panelEl.getBoundingClientRect().top;
    if (top >= covered - 4 && top < window.innerHeight * 0.75) return;
    window.scrollBy({ top: top - covered - 8, behavior: "smooth" });
  }

  // ── Clicks ────────────────────────────────────────────────────────────────
  root.addEventListener("click", (e) => {
    const t = e.target;
    if (t.closest("[data-show-plan]")) {
      sideEl.classList.remove("is-collapsed");
      window.scrollBy({ top: planEl.getBoundingClientRect().top - headerBottom() - 40, behavior: "smooth" });
      return;
    }
    if (t.closest("[data-close-info]")) {
      state.info = null;
      draw();
      return;
    }
    const productEl = t.closest("[data-product]");
    if (productEl) {
      state.info = productEl.dataset.product;
      draw();
      revealInfo();
      return;
    }
    const goto = t.closest("[data-goto]");
    const size = t.closest("[data-size]");
    const kind = t.closest("[data-kind]");
    const heating = t.closest("[data-heating]");
    const balconies = t.closest("[data-balconies]");
    const answerEl = t.closest("[data-answer]");
    const roomEl = t.closest("[data-room]");
    const rqty = t.closest("[data-rqty]");
    if (t.closest("[data-toggle-plan]")) {
      const collapsed = sideEl.classList.toggle("is-collapsed");
      const button = t.closest("[data-toggle-plan]");
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
    if (t.closest("[data-close-room]")) {
      state.room = null;
      draw();
      revealPanel();
      return;
    }
    if (answerEl) {
      answer(answerEl.dataset.answer, answerEl.dataset.yes === "1");
      draw();
      revealPanel();
      return;
    }
    if (t.closest("[data-prev-q]")) {
      if (state.q > 0) state.q -= 1;
      else state.step = 1;
      draw();
      return;
    }
    if (t.closest("[data-skip-q]")) {
      state.q = questions.length;
      state.step = 3;
      draw();
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
    if (kind) {
      const k = heatingKinds.find((x) => x.id === kind.dataset.kind);
      const current = kindOf(state.heating);
      if (current?.id !== k.id) chooseHeating(k.system || k.floor.petek);
      draw();
      return;
    }
    if (heating) {
      chooseHeating(heating.dataset.heating);
      draw();
      return;
    }
    if (t.closest("[data-load-saved]")) {
      state = fromOrder(getOrder().custom);
      planKey = null;
      draw();
      return;
    }
    if (t.closest("[data-finish]")) {
      state.chosen = true;
      save();
      setCustom(custom());
      location.href = "/cart.html";
    }
  });

  // Rooms on the plan work with the keyboard too.
  root.addEventListener("keydown", (e) => {
    const productEl = e.target.closest?.("[data-product]");
    if (productEl && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      state.info = productEl.dataset.product;
      draw();
      revealInfo();
      return;
    }
    const roomEl = e.target.closest?.(".floor-plan [data-room]");
    if (roomEl && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      openRoom(roomEl.dataset.room);
    }
  });

  // Switching between phone and computer layout moves the room editor.
  phone.addEventListener?.("change", draw);

  draw();
}
