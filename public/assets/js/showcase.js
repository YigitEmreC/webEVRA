// Home page showcase. Data (texts, spots, brands, scenes): public/data/showcase.js.
//  • #house-tour   a cut-out render of a flat (assets/img/maketev.webp); tap a dot to see the product
//                  (name, what it does, automations; from catalog.js).
//  • #brand-strip  two slowly moving rows of brands the system can work with.
//  • #tablet-demo  a wall-panel dashboard in the page: scenes, rooms, climate,
//                  security. Plain HTML + a little JS: no images, no video, so it
//                  costs almost nothing to load.
//  • #day-tour     "Evra'lı bir gün": one open card, the other times as narrow tabs.
//  • #room-tour    "Oda oda akıllı ev": a left–right slider, one illustrated room per
//                  slide with its devices as coloured markers and a short list.

import { houseSpots, protocols, brands, tablet, day, roomTour } from "../../data/showcase.js";
import { roomSceneSvg } from "./room-scenes.js";
import { findItem } from "./pricing.js";
import { categoryIcon } from "./floor-plan.js";
import { escapeHtml, icon } from "./ui.js";

const reduceMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const svgIcon = (paths, cls = "") => `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${paths}</svg>`;

/** One colour per product category: markers, glows and list icons. */
export const CAT_COLORS = {
  "Merkez ve ekran": "#3d6fd9",
  Aydınlatma: "#f5a524",
  "Priz ve anahtarlar": "#1fa392",
  Sensörler: "#7a5be0",
  Isıtma: "#e0614f",
  Güvenlik: "#2f9e5f",
  "Perde ve panjur": "#d0568f",
  "Su ve bahçe": "#1e9bd7",
};
const catColor = (p) => CAT_COLORS[p.category] || "#3d6fd9";

export function initShowcase() {
  initHouse();
  initRooms();
  initBrands();
  initTablet();
  initDay();
}

// ── Interactive house ───────────────────────────────────────────────────────
function initHouse() {
  const root = document.getElementById("house-tour");
  if (!root) return;
  const stage = root.querySelector("[data-house-stage]");
  const card = root.querySelector("[data-house-card]");
  // The flat model (cut-out render) with the device dots on top. Dots and glows sit in
  // one frame with the photo's proportions, so they stay on their devices at any size.
  stage.insertAdjacentHTML(
    "afterbegin",
    `<div class="house-frame">
      <img class="house-img" src="/assets/img/maketev.webp" width="1009" height="724" alt="Akıllı cihazlarıyla 1+1 bir ev, kuşbakışı" loading="lazy" decoding="async">
      ${houseSpots
        .map((s) => {
          const p = findItem(s.id);
          return p ? `<span class="house-glow" style="left:${s.x}%;top:${s.y}%;--cc:${catColor(p)}" aria-hidden="true"></span>` : "";
        })
        .join("")}
      ${houseSpots
        .map((s, i) => {
          const p = findItem(s.id);
          if (!p) return "";
          return `<button type="button" class="house-spot" style="left:${s.x}%;top:${s.y}%;--d:${(i % 5) * 0.4}s;--cc:${catColor(p)}" data-spot="${escapeHtml(s.id)}" aria-label="${escapeHtml(p.name)}">
            <span class="house-spot-ring" aria-hidden="true"></span>
            <svg viewBox="0 0 24 24" aria-hidden="true">${categoryIcon(p.category)}</svg>
            <span class="house-spot-label">${escapeHtml(p.name)}</span>
          </button>`;
        })
        .join("")}
    </div>`
  );

  let current = null;
  function show(id, pinned) {
    const spot = houseSpots.find((s) => s.id === id);
    const p = findItem(id);
    if (!spot || !p) return;
    current = { id, pinned };
    stage.querySelectorAll(".house-spot").forEach((b) => b.classList.toggle("is-active", b.dataset.spot === id));
    card.style.setProperty("--cc", catColor(p));
    card.innerHTML = `
      <p class="house-card-kicker">${escapeHtml(p.category)}</p>
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.description)}</p>
      ${p.uses?.length ? `<ul>${p.uses.slice(0, 3).map((u) => `<li>${icon("check")}<span>${escapeHtml(u)}</span></li>`).join("")}</ul>` : ""}`;
    card.hidden = false;
    // Next to the dot on large screens (left or right of it), under the drawing on phones.
    card.style.setProperty("--x", `${spot.x}%`);
    card.style.setProperty("--y", `${spot.y}%`);
    card.classList.toggle("is-left", spot.x > 58);
  }
  function hide() {
    if (current?.pinned) return;
    current = null;
    card.hidden = true;
    stage.querySelectorAll(".house-spot").forEach((b) => b.classList.remove("is-active"));
  }

  stage.addEventListener("mouseover", (e) => {
    const b = e.target.closest(".house-spot");
    if (b && !current?.pinned) show(b.dataset.spot, false);
  });
  stage.addEventListener("mouseleave", hide);
  stage.addEventListener("click", (e) => {
    const b = e.target.closest(".house-spot");
    if (!b) {
      if (current) {
        current.pinned = false;
        hide();
      }
      return;
    }
    if (current?.id === b.dataset.spot && current.pinned) {
      current.pinned = false;
      hide();
    } else show(b.dataset.spot, true);
  });
  stage.addEventListener("focusin", (e) => {
    const b = e.target.closest(".house-spot");
    if (b) show(b.dataset.spot, true);
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && current) {
      current.pinned = false;
      hide();
    }
  });
}

// ── Room by room slider ──────────────────────────────────────────────────────
// Colours above and below the drawing (wall, floor) when the card is taller than it.
const ROOM_BANDS = {
  salon: ["#efe6ff", "#c99a6b"],
  mutfak: ["#fff3e0", "#ddd5ca"],
  yatak: ["#e4efff", "#bd8f62"],
  banyo: ["#e3f7f4", "#d3dcdf"],
  cocuk: ["#fff0f6", "#dcb791"],
  giris: ["#eef1f8", "#ad9881"],
  balkon: ["#8fd0ff", "#b57f52"],
};
function initRooms() {
  const root = document.getElementById("room-tour");
  if (!root) return;
  const track = root.querySelector("[data-room-track]");
  const chips = root.querySelector("[data-room-chips]");

  chips.innerHTML = roomTour
    .map((r, i) => `<button type="button" class="chip" data-room-go="${i}" aria-pressed="${i === 0}">${escapeHtml(r.name)}</button>`)
    .join("");
  track.innerHTML = roomTour
    .map((r, i) => {
      const items = r.devices.map((d) => ({ ...d, p: findItem(d.id) })).filter((d) => d.p);
      return `
      <article class="room-slide room-${escapeHtml(r.id)}" data-room-slide="${i}" aria-roledescription="slayt" aria-label="${i + 1} / ${roomTour.length}: ${escapeHtml(r.name)}">
        <div class="room-scene" style="--wall:${ROOM_BANDS[r.id]?.[0] || "#eef1f8"};--floor:${ROOM_BANDS[r.id]?.[1] || "#d9cfc2"}">
          <div class="room-scene-inner">
          ${roomSceneSvg(r.id, escapeHtml(r.name))}
          ${items
            .map(
              (d, n) => `<button type="button" class="room-marker" style="left:${d.x}%;top:${d.y}%;--cc:${catColor(d.p)}" data-marker="${n}" aria-label="${escapeHtml(d.p.name)}">
                <svg viewBox="0 0 24 24" aria-hidden="true">${categoryIcon(d.p.category)}</svg><span>${n + 1}</span></button>`
            )
            .join("")}
          </div>
        </div>
        <div class="room-info">
          <p class="room-count">${String(i + 1).padStart(2, "0")} / ${String(roomTour.length).padStart(2, "0")}</p>
          <h3>${escapeHtml(r.name)}</h3>
          <p class="room-tagline">${escapeHtml(r.tagline)}</p>
          <ol class="room-devices">
            ${items
              .map(
                (d, n) => `
              <li data-item="${n}" style="--cc:${catColor(d.p)}">
                <span class="room-dev-icon"><svg viewBox="0 0 24 24" aria-hidden="true">${categoryIcon(d.p.category)}</svg></span>
                <span class="room-dev-text"><strong>${escapeHtml(d.p.name)}</strong><span>${escapeHtml(d.auto)}</span></span>
              </li>`
              )
              .join("")}
          </ol>
        </div>
      </article>`;
    })
    .join("");

  const slides = [...track.querySelectorAll(".room-slide")];
  let index = 0;
  const go = (i) => {
    index = (i + slides.length) % slides.length;
    track.scrollTo({ left: slides[index].offsetLeft - track.offsetLeft, behavior: reduceMotion() ? "auto" : "smooth" });
  };
  const mark = (i) => {
    index = i;
    chips.querySelectorAll("[data-room-go]").forEach((c) => c.setAttribute("aria-pressed", String(Number(c.dataset.roomGo) === i)));
  };
  root.querySelector("[data-room-prev]").addEventListener("click", () => go(index - 1));
  root.querySelector("[data-room-next]").addEventListener("click", () => go(index + 1));
  chips.addEventListener("click", (e) => {
    const c = e.target.closest("[data-room-go]");
    if (c) go(Number(c.dataset.roomGo));
  });
  // Which slide is in view (also when the visitor swipes or scrolls).
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && mark(Number(en.target.dataset.roomSlide))),
      { root: track, threshold: 0.6 }
    );
    slides.forEach((s) => io.observe(s));
  }
  root.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") go(index + 1);
    if (e.key === "ArrowLeft") go(index - 1);
  });
  // Marker ↔ list: pointing at one lights up the other.
  track.addEventListener("pointerover", (e) => highlight(e.target.closest("[data-marker], [data-item]")));
  track.addEventListener("focusin", (e) => highlight(e.target.closest("[data-marker]")));
  track.addEventListener("click", (e) => highlight(e.target.closest("[data-marker], [data-item]")));
  function highlight(el) {
    if (!el) return;
    const slide = el.closest(".room-slide");
    const n = el.dataset.marker ?? el.dataset.item;
    slide.querySelectorAll(".is-hot").forEach((x) => x.classList.remove("is-hot"));
    slide.querySelector(`[data-marker="${n}"]`)?.classList.add("is-hot");
    slide.querySelector(`[data-item="${n}"]`)?.classList.add("is-hot");
  }
}

// ── Brand strip ─────────────────────────────────────────────────────────────
function initBrands() {
  const root = document.getElementById("brand-strip");
  if (!root) return;
  const row = (list, reverse) => `
    <div class="brand-row${reverse ? " is-reverse" : ""}">
      <ul class="brand-track">${[...list, ...list].map((b, i) => `<li${i >= list.length ? ' aria-hidden="true"' : ""}>${escapeHtml(b)}</li>`).join("")}</ul>
    </div>`;
  root.querySelector("[data-protocols]").innerHTML = protocols.map((p) => `<li>${escapeHtml(p)}</li>`).join("");
  root.querySelector("[data-brand-rows]").innerHTML = brands.map((list, i) => row(list, i % 2 === 1)).join("");
}

// ── Tablet demo ─────────────────────────────────────────────────────────────
const TILE_ICONS = {
  lights: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v.1h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>',
  climate: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/><path d="M12 9v7"/>',
  security: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z"/>',
  cameras: '<rect x="3" y="7" width="13" height="10" rx="2"/><path d="m16 11 5-3v8l-5-3"/>',
  shades: '<path d="M4 4h16M6 4v15M18 4v15M6 9h12M6 14h12"/>',
  energy: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
};
const TILE_NAMES = { lights: "Aydınlatma", climate: "İklim", security: "Güvenlik", cameras: "Kameralar", shades: "Perdeler", energy: "Enerji" };
const TABS = [
  ["home", "Ana sayfa"],
  ["lights", "Işıklar"],
  ["climate", "İklim"],
  ["shades", "Perdeler"],
  ["security", "Güvenlik"],
  ["energy", "Enerji"],
];
/** Which tab a status tile on the home screen opens. */
const TILE_TAB = { lights: "lights", climate: "climate", security: "security", cameras: "security", shades: "shades", energy: "energy" };
const EVENT_ICONS = {
  scene: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.9 1.9 0 0 0 3.4 0"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  shades: '<path d="M4 4h16M6 4v15M18 4v15M6 9h12M6 14h12"/>',
};
/** Shade position per scene (open %); missing = leave as is. */
const SCENE_SHADES = { morning: 100, away: 0, movie: 0, sleep: 0, vacation: 0, home: 50 };
const SCENE_LIGHTS = {
  morning: (name) => name !== "Yatak odası",
  away: () => false,
  movie: (name) => name === "Salon",
  sleep: () => false,
  home: (name) => ["Salon", "Hol", "Mutfak"].includes(name),
  vacation: () => false,
};

function initTablet() {
  const root = document.getElementById("tablet-demo");
  if (!root) return;
  const screen = root.querySelector("[data-tablet-screen]");
  let lastKey = "";
  const state = {
    tab: "home",
    scene: "movie",
    lights: Object.fromEntries(tablet.rooms.map((r, i) => [r.name, i === 0])),
    temps: Object.fromEntries(tablet.rooms.map((r) => [r.name, r.temp])),
    armed: false,
    locked: true,
    shades: Object.fromEntries((tablet.shades || []).map((s) => [s.name, s.open])),
    devices: Object.fromEntries((tablet.energy?.devices || []).map((d) => [d.name, d.on])),
  };

  const greeting = () => {
    const h = new Date().getHours();
    return h < 6 ? "İyi geceler" : h < 12 ? "Günaydın" : h < 18 ? "İyi günler" : "İyi akşamlar";
  };
  const clock = () => new Date().toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });

  function homeHtml() {
    const scene = tablet.scenes.find((s) => s.id === state.scene);
    return `
      <p class="tab-hello">${greeting()}<span>.</span></p>
      <p class="tab-sub">Dışarısı 12°, içerisi 22°. <strong>${escapeHtml(scene.name)}</strong> sahnesi açık.</p>
      <p class="tab-label">Sahneler <span>Tüm ev için</span></p>
      <div class="tab-scenes">
        ${tablet.scenes
          .map(
            (s) => `
          <button type="button" class="tab-scene${s.id === state.scene ? " is-on" : ""}" data-scene="${s.id}" aria-pressed="${s.id === state.scene}">
            <span class="tab-scene-top">${svgIcon(s.icon)}${s.id === state.scene ? `<em>Açık ${icon("check")}</em>` : `<i aria-hidden="true">▶</i>`}</span>
            <strong>${escapeHtml(s.name)}</strong>
            <span>${escapeHtml(s.text)}</span>
          </button>`
          )
          .join("")}
      </div>
      <p class="tab-label">Ev <span>Şu an</span></p>
      <div class="tab-tiles">
        ${Object.entries(scene.status)
          .map(
            ([key, [mode, detail]]) => `
          <button type="button" class="tab-tile" data-tab="${TILE_TAB[key] || "home"}">
            <span class="tab-tile-name">${svgIcon(TILE_ICONS[key])}${TILE_NAMES[key]}</span>
            <strong>${escapeHtml(mode)}</strong>
            <span>${escapeHtml(detail)}</span>
          </button>`
          )
          .join("")}
      </div>
      ${
        tablet.events?.length
          ? `
      <p class="tab-label">Son olaylar <span>Bugün</span></p>
      <ul class="tab-events">
        ${tablet.events
          .map((ev) => `<li><span class="tab-ev-icon">${svgIcon(EVENT_ICONS[ev.icon] || EVENT_ICONS.bell)}</span><span class="tab-ev-text">${escapeHtml(ev.text)}</span><time>${escapeHtml(ev.time)}</time></li>`)
          .join("")}
      </ul>`
          : ""
      }`;
  }

  function shadesHtml() {
    const open = Object.values(state.shades).filter((v) => v > 0).length;
    return `
      <p class="tab-hello">Perdeler<span>.</span></p>
      <p class="tab-sub">${open} / ${tablet.shades.length} açık. Dokunun: kapalı → yarım → açık.</p>
      <div class="tab-rooms">
        ${tablet.shades
          .map((s) => {
            const v = state.shades[s.name];
            return `
          <button type="button" class="tab-room tab-shade${v ? " is-on" : ""}" data-shade="${escapeHtml(s.name)}" aria-label="${escapeHtml(s.name)} perdesi: %${v} açık">
            <span class="tab-shade-win" aria-hidden="true"><span style="height:${100 - v}%"></span></span>
            <strong>${escapeHtml(s.name)}</strong><span>${v === 0 ? "Kapalı" : v === 100 ? "Açık" : `%${v} açık`}</span>
          </button>`;
          })
          .join("")}
      </div>
      <div class="tab-quick">
        <button type="button" data-shades-all="100">Hepsini aç</button>
        <button type="button" data-shades-all="0">Hepsini kapat</button>
      </div>`;
  }

  function energyHtml() {
    const e = tablet.energy;
    const max = Math.max(...e.hours);
    const now = new Date().getHours();
    // Last 24 hours, oldest first, ending with the current hour.
    const last = Array.from({ length: 24 }, (_, i) => (now + 1 + i) % 24);
    const total = e.hours.reduce((a, b) => a + b, 0);
    const live = e.devices.reduce((sum, d) => sum + (state.devices[d.name] ? d.watt || 60 : 0), 0);
    return `
      <p class="tab-hello">Enerji<span>.</span></p>
      <p class="tab-sub">Şu an <strong>${(live / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 2 })} kW</strong> · son 24 saatte ${total.toLocaleString("tr-TR", { maximumFractionDigits: 1 })} kWh</p>
      <div class="tab-chart" role="img" aria-label="Son 24 saatin saatlik tüketimi">
        ${last.map((h) => `<span class="${h === now ? "is-now" : ""}" style="height:${Math.round((e.hours[h] / max) * 100)}%" title="${String(h).padStart(2, "0")}:00 · ${e.hours[h].toLocaleString("tr-TR")} kWh"></span>`).join("")}
      </div>
      <div class="tab-chart-axis" aria-hidden="true">${[0, 6, 12, 18].map((i) => `<span>${String(last[i]).padStart(2, "0")}:00</span>`).join("")}<span>Şimdi</span></div>
      <p class="tab-label">Cihazlar <span>Prizden açıp kapatın</span></p>
      <div class="tab-devices">
        ${e.devices
          .map((d) => {
            const on = state.devices[d.name];
            return `
          <button type="button" class="tab-device${on ? " is-on" : ""}" ${d.fixed ? "disabled" : `data-device="${escapeHtml(d.name)}"`} aria-pressed="${on}">
            <strong>${escapeHtml(d.name)}</strong>
            <span>${d.fixed ? "Hep açık" : on ? `${d.watt || 60} W` : "Kapalı"}</span>
            <i aria-hidden="true"></i>
          </button>`;
          })
          .join("")}
      </div>`;
  }

  function lightsHtml() {
    const on = Object.values(state.lights).filter(Boolean).length;
    return `
      <p class="tab-hello">Işıklar<span>.</span></p>
      <p class="tab-sub">${on} oda açık. Bir odaya dokunun.</p>
      <div class="tab-rooms">
        ${tablet.rooms
          .map(
            (r) => `
          <button type="button" class="tab-room${state.lights[r.name] ? " is-on" : ""}" data-light="${escapeHtml(r.name)}" aria-pressed="${state.lights[r.name]}">
            ${svgIcon(TILE_ICONS.lights)}<strong>${escapeHtml(r.name)}</strong><span>${state.lights[r.name] ? `Açık · ${r.lights} ampul` : "Kapalı"}</span>
          </button>`
          )
          .join("")}
      </div>`;
  }

  function climateHtml() {
    return `
      <p class="tab-hello">İklim<span>.</span></p>
      <p class="tab-sub">Her oda ayrı ısınır; boş oda ısıtılmaz.</p>
      <div class="tab-rooms">
        ${tablet.rooms
          .map(
            (r) => `
          <div class="tab-room tab-temp">
            ${svgIcon(TILE_ICONS.climate)}<strong>${escapeHtml(r.name)}</strong>
            <span class="tab-stepper">
              <button type="button" data-temp="${escapeHtml(r.name)}" data-delta="-1" aria-label="${escapeHtml(r.name)} sıcaklığı azalt">−</button>
              <output>${state.temps[r.name]}°</output>
              <button type="button" data-temp="${escapeHtml(r.name)}" data-delta="1" aria-label="${escapeHtml(r.name)} sıcaklığı artır">+</button>
            </span>
          </div>`
          )
          .join("")}
      </div>`;
  }

  function securityHtml() {
    return `
      <p class="tab-hello">Güvenlik<span>.</span></p>
      <p class="tab-sub">${state.armed ? "Alarm kurulu. Hareket olursa siren çalar ve size haber verilir." : "Alarm kapalı. Evden çıkarken tek dokunuşla kurun."}</p>
      <div class="tab-rooms">
        <button type="button" class="tab-room${state.armed ? " is-on is-alert" : ""}" data-arm aria-pressed="${state.armed}">${svgIcon(TILE_ICONS.security)}<strong>Alarm</strong><span>${state.armed ? "Kurulu" : "Kapalı"}</span></button>
        <button type="button" class="tab-room${state.locked ? " is-on" : ""}" data-lock aria-pressed="${state.locked}">${svgIcon('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>')}<strong>Giriş kapısı</strong><span>${state.locked ? "Kilitli" : "Açık"}</span></button>
        <div class="tab-room">${svgIcon('<path d="M4 4h16v16H4z"/><path d="M4 12h16"/>')}<strong>Pencereler</strong><span>Hepsi kapalı</span></div>
        <div class="tab-room tab-cam">${svgIcon(TILE_ICONS.cameras)}<strong>Kapı önü</strong><span>Canlı · kimse yok</span></div>
      </div>`;
  }

  function draw(changed = "tab") {
    const body = { home: homeHtml, lights: lightsHtml, climate: climateHtml, shades: shadesHtml, security: securityHtml, energy: energyHtml }[state.tab]();
    const key = `${state.tab}|${state.scene}`;
    const anim = key !== lastKey ? (changed === "scene" ? "is-scene-change" : "is-tab-change") : "";
    lastKey = key;
    screen.innerHTML = `
      <div class="tab-top">
        <span class="tab-logo"><span aria-hidden="true">${svgIcon('<path d="M3 11 12 4l9 7v9H3v-9Z"/>')}</span><span><strong>EVRA</strong><em>Örnek ev</em></span></span>
        <nav class="tab-nav" aria-label="Ekran menüsü">${TABS.map(([id, name]) => `<button type="button" data-tab="${id}" aria-current="${state.tab === id ? "page" : "false"}">${name}</button>`).join("")}</nav>
        <span class="tab-clock" data-clock>${clock()}</span>
      </div>
      <div class="tab-body ${anim}">${body}</div>`;
  }

  screen.addEventListener("click", (e) => {
    const t = e.target;
    const tab = t.closest("[data-tab]");
    const scene = t.closest("[data-scene]");
    const light = t.closest("[data-light]");
    const temp = t.closest("[data-temp]");
    let changed = "tab";
    if (scene) {
      changed = "scene";
      state.scene = scene.dataset.scene;
      const lit = SCENE_LIGHTS[state.scene] || (() => false);
      for (const r of tablet.rooms) state.lights[r.name] = lit(r.name);
      state.armed = ["away", "vacation"].includes(state.scene);
      state.locked = state.scene === "home" ? false : state.scene !== "morning" || state.locked;
      if (state.scene in SCENE_SHADES) for (const s of Object.keys(state.shades)) state.shades[s] = SCENE_SHADES[state.scene];
      if (state.scene === "movie") state.devices["TV ve ses sistemi"] = true;
      if (["away", "vacation", "sleep"].includes(state.scene)) state.devices["TV ve ses sistemi"] = false;
    } else if (tab) state.tab = tab.dataset.tab;
    else if (t.closest("[data-shade]")) {
      const name = t.closest("[data-shade]").dataset.shade;
      state.shades[name] = state.shades[name] === 0 ? 50 : state.shades[name] === 50 ? 100 : 0;
    } else if (t.closest("[data-shades-all]")) {
      const v = Number(t.closest("[data-shades-all]").dataset.shadesAll);
      for (const s of Object.keys(state.shades)) state.shades[s] = v;
    } else if (t.closest("[data-device]")) {
      const name = t.closest("[data-device]").dataset.device;
      state.devices[name] = !state.devices[name];
    } else if (light) state.lights[light.dataset.light] = !state.lights[light.dataset.light];
    else if (temp) state.temps[temp.dataset.temp] = Math.min(28, Math.max(15, state.temps[temp.dataset.temp] + Number(temp.dataset.delta)));
    else if (t.closest("[data-arm]")) state.armed = !state.armed;
    else if (t.closest("[data-lock]")) state.locked = !state.locked;
    else return;
    draw(changed);
  });

  // 3D: the tablet leans towards the pointer, and swings into place when it scrolls into view.
  const frame = root;
  if (!reduceMotion()) {
    frame.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = frame.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      frame.style.setProperty("--ry", `${(x * 6).toFixed(2)}deg`);
      frame.style.setProperty("--rx", `${(-y * 5).toFixed(2)}deg`);
      frame.style.setProperty("--gx", `${((x + 0.5) * 100).toFixed(0)}%`);
      frame.style.setProperty("--gy", `${((y + 0.5) * 100).toFixed(0)}%`);
    });
    frame.addEventListener("pointerleave", () => {
      frame.style.setProperty("--ry", "0deg");
      frame.style.setProperty("--rx", "0deg");
    });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          frame.classList.add("is-in");
          io.disconnect();
        }
      }, { threshold: 0.25 });
      io.observe(frame);
    } else frame.classList.add("is-in");
  } else frame.classList.add("is-in");

  draw();
  setInterval(() => {
    const el = screen.querySelector("[data-clock]");
    if (el) el.textContent = clock();
  }, 30000);
}

// ── A day with Evra ─────────────────────────────────────────────────────────
const DAY_ART = {
  dawn: '<circle cx="12" cy="15" r="4"/><path d="M12 5v2M5 15H3M21 15h-2M6.3 9.3 7.7 10.7M17.7 9.3l-1.4 1.4M3 19h18"/>',
  noon: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  dusk: '<path d="M3 11 12 4l9 7v9H3v-9Z"/><path d="M10 20v-5h4v5"/>',
  evening: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v.1h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>',
  movie: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4M10 9l4 2-4 2Z"/>',
  night: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
  more: '<path d="M12 5v14M5 12h14"/>',
};

function initDay() {
  const root = document.getElementById("day-tour");
  if (!root) return;
  let open = 0;
  let timer = null;

  function draw() {
    root.innerHTML = day
      .map(
        (d, i) => `
      <article class="day-card day-${d.theme}${i === open ? " is-open" : ""}" ${d.image ? `style="--img:url('${escapeHtml(d.image)}')"` : ""}>
        <button type="button" class="day-tab" data-day="${i}" aria-expanded="${i === open}" aria-controls="day-panel-${i}">
          <span class="day-tab-label">${escapeHtml(d.label)}</span>
          <span class="day-tab-time">${escapeHtml(d.time === "+" ? "" : d.time)}${d.time === "+" ? svgIcon(DAY_ART.more) : ""}</span>
        </button>
        <div class="day-panel" id="day-panel-${i}" ${i === open ? "" : "hidden"}>
          ${svgIcon(DAY_ART[d.theme], "day-art")}
          <p class="day-kicker">${d.time === "+" ? "" : `${escapeHtml(d.time)} · `}${escapeHtml(d.label)}</p>
          <h3>${escapeHtml(d.title)}</h3>
          <p>${escapeHtml(d.text)}</p>
          <ul>${d.tags.map((t) => `<li>${icon("check")}${escapeHtml(t)}</li>`).join("")}</ul>
        </div>
      </article>`
      )
      .join("");
  }

  const choose = (i) => {
    if (i === open) return;
    open = i;
    root.querySelectorAll(".day-card").forEach((card, n) => {
      const on = n === open;
      card.classList.toggle("is-open", on);
      card.querySelector(".day-tab").setAttribute("aria-expanded", String(on));
      const panel = card.querySelector(".day-panel");
      panel.hidden = !on;
      if (on) {
        panel.classList.remove("is-showing");
        void panel.offsetWidth; // restart the slide-in
        panel.classList.add("is-showing");
      }
    });
  };
  root.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-day]");
    if (!tab) return;
    stop();
    choose(Number(tab.dataset.day));
  });

  // Moves on by itself every few seconds until the visitor takes over.
  const start = () => {
    if (reduceMotion() || timer) return;
    timer = setInterval(() => choose((open + 1) % day.length), 6500);
  };
  const stop = () => {
    clearInterval(timer);
    timer = null;
  };
  root.addEventListener("mouseenter", stop);
  root.addEventListener("focusin", stop);
  if ("IntersectionObserver" in window) {
    new IntersectionObserver((entries) => (entries[0].isIntersecting ? start() : stop()), { threshold: 0.4 }).observe(root);
  }
  draw();
}
