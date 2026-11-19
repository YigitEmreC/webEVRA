// Products page: renders public/data/catalog.js with category filters and search.
// Products are not sold on their own:
//  • No package chosen yet → the page is a catalogue, with a prompt to pick a package.
//  • Package chosen → each product can be added as an extra, and a bar at the
//    bottom leads to the request form (/cart.html). Extras have no price on the
//    site; it is agreed with the customer when we call them.
// The chosen category and search text are kept in the URL (?kategori=…&ara=…).

import { products } from "../../data/catalog.js";
import { findItem } from "./pricing.js";
import { getOrder, toggleExtra, onOrderChange } from "./cart-store.js";
import { escapeHtml, icon, mediaHtml, toast } from "./ui.js";

const ALL = "all";

/** Lowercase and strip Turkish/other accents so "sicaklik" finds "Sıcaklık". */
function fold(text) {
  return String(text)
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function initProducts() {
  const list = document.getElementById("product-list");
  if (!list) return;

  const filters = document.getElementById("product-filters");
  const search = document.getElementById("product-search");
  const count = document.getElementById("product-count");
  const empty = document.getElementById("product-empty");
  const banner = document.getElementById("product-mode");
  const byId = new Map(products.map((p) => [p.id, p]));
  const haystack = new Map(
    products.map((p) => [p.id, fold(`${p.name} ${p.category} ${p.description} ${(p.features || []).join(" ")}`)])
  );
  const categories = [...new Set(products.map((p) => p.category))];

  const params = new URLSearchParams(location.search);
  let active = categories.includes(params.get("kategori")) ? params.get("kategori") : ALL;
  search.value = params.get("ara") || "";

  filters.innerHTML = [ALL, ...categories]
    .map(
      (c) => `<button type="button" class="chip" data-category="${escapeHtml(c)}" aria-pressed="${c === active}">
        ${c === ALL ? "Tümü" : escapeHtml(c)} <span class="chip-count" data-count-for="${escapeHtml(c)}"></span>
      </button>`
    )
    .join("");

  list.innerHTML = products.map(card).join("");

  // Bottom bar shown while choosing extras
  const bar = document.createElement("div");
  bar.className = "order-bar";
  bar.hidden = true;
  document.body.append(bar);

  function matchesSearch(p, words) {
    const text = haystack.get(p.id);
    return words.every((w) => text.includes(w));
  }

  function apply() {
    const words = fold(search.value.trim()).split(/\s+/).filter(Boolean);

    // Chip counts follow the search, so you can see where the matches are.
    const perCategory = new Map([[ALL, 0]]);
    for (const p of products) {
      if (!matchesSearch(p, words)) continue;
      perCategory.set(ALL, perCategory.get(ALL) + 1);
      perCategory.set(p.category, (perCategory.get(p.category) || 0) + 1);
    }
    filters.querySelectorAll("[data-count-for]").forEach((el) => {
      const n = perCategory.get(el.dataset.countFor) || 0;
      el.textContent = n;
      el.closest(".chip").classList.toggle("is-empty", n === 0);
    });

    let shown = 0;
    for (const el of list.children) {
      const p = byId.get(el.dataset.id);
      const visible = (active === ALL || p.category === active) && matchesSearch(p, words);
      el.hidden = !visible;
      if (visible) shown++;
    }

    const filtered = active !== ALL || words.length > 0;
    count.innerHTML = filtered
      ? `${shown} / ${products.length} ürün gösteriliyor <button type="button" class="link-button" data-clear>Filtreleri temizle</button>`
      : `${products.length} ürün`;
    empty.hidden = shown > 0;

    const next = new URLSearchParams();
    if (active !== ALL) next.set("kategori", active);
    if (search.value.trim()) next.set("ara", search.value.trim());
    const query = next.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${location.hash}`);
  }

  function setCategory(category) {
    active = category;
    filters.querySelectorAll(".chip").forEach((chip) => {
      const on = chip.dataset.category === active;
      chip.setAttribute("aria-pressed", String(on));
      if (on) chip.scrollIntoView({ block: "nearest", inline: "nearest" });
    });
    apply();
  }

  function clearAll() {
    search.value = "";
    setCategory(ALL);
    search.focus();
  }

  /** Banner, card buttons and bottom bar follow the visitor's package request. */
  function syncOrder() {
    const order = getOrder();
    const pkg = order.package ? findItem(order.package) : null;
    const choosing = Boolean(pkg && pkg.kind === "package");
    const included = new Set(choosing ? pkg.items.map((i) => i.id) : []);

    banner.innerHTML = choosing
      ? `<div class="mode-banner is-active">
          <div>
            <p class="mode-title">${icon("check")}<span>Seçtiğiniz paket: <strong>${escapeHtml(pkg.name)}</strong></span></p>
            <p class="muted">Paketinize eklemek istediğiniz ekstra ürünleri seçin. Ekstra ürünlerin fiyatı sizinle iletişime geçtiğimizde birlikte belirlenir.</p>
          </div>
          <div class="mode-actions">
            <a class="btn btn-primary" href="/cart.html">Devam et</a>
            <a class="btn btn-secondary" href="/packages.html">Paketi değiştir</a>
          </div>
        </div>`
      : `<div class="mode-banner">
          <div>
            <p class="mode-title">${icon("layers")}<span>Ürünler tek başına satılmaz</span></p>
            <p class="muted">Önce bir paket seçin. Paketinizi seçtikten sonra bu sayfadan dilediğiniz ürünleri ekstra olarak ekleyebilirsiniz.</p>
          </div>
          <div class="mode-actions">
            <a class="btn btn-primary" href="/packages.html">Paketleri incele</a>
          </div>
        </div>`;

    list.querySelectorAll(".product-card").forEach((el) => {
      const id = el.dataset.id;
      const footer = el.querySelector(".card-footer");
      const tag = el.querySelector("[data-included]");
      tag.hidden = !included.has(id);
      if (!choosing) {
        footer.hidden = true;
        return;
      }
      footer.hidden = false;
      const on = order.extras.includes(id);
      const btn = footer.querySelector("[data-extra]");
      btn.setAttribute("aria-pressed", String(on));
      btn.classList.toggle("btn-primary", !on);
      btn.classList.toggle("btn-secondary", on);
      btn.innerHTML = on ? `${icon("check")} Eklendi` : "Ekstra olarak ekle";
    });

    bar.hidden = !choosing;
    document.body.classList.toggle("has-order-bar", choosing);
    if (choosing) {
      const n = order.extras.length;
      bar.innerHTML = `
        <div class="container order-bar-inner">
          <p><strong>${escapeHtml(pkg.name)}</strong><span class="muted"> · ${n ? `${n} ekstra ürün` : "ekstra ürün yok"}</span></p>
          <a class="btn btn-primary" href="/cart.html">Devam et</a>
        </div>`;
    }
  }

  filters.addEventListener("click", (e) => {
    const button = e.target.closest("[data-category]");
    if (button) setCategory(button.dataset.category);
  });
  search.addEventListener("input", apply);
  search.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && search.value) {
      search.value = "";
      apply();
    }
  });
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-clear]")) clearAll();
  });
  list.addEventListener("click", (e) => {
    const button = e.target.closest("[data-extra]");
    if (!button) return;
    const p = byId.get(button.dataset.extra);
    const on = toggleExtra(p.id);
    toast(on ? `${p.name} ekstra olarak eklendi` : `${p.name} çıkarıldı`, { href: "/cart.html", text: "Siparişim" });
  });

  onOrderChange(syncOrder);
  syncOrder();
  apply();

  // Opened from a link like /products.html#product-smart-plug
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

function card(p) {
  const id = escapeHtml(p.id);
  const features = (p.features || []).map((f) => `<li>${escapeHtml(f)}</li>`).join("");
  return `
    <article class="card product-card" data-id="${id}" id="product-${id}">
      <div class="card-media">${mediaHtml(p)}</div>
      <div class="card-body">
        <p class="card-kicker">${escapeHtml(p.category)} <span class="included-tag" data-included hidden>Paketinizde var</span></p>
        <h3 class="card-title">${escapeHtml(p.name)}</h3>
        <p class="card-text">${escapeHtml(p.description)}</p>
        ${features ? `<ul class="tag-list">${features}</ul>` : ""}
      </div>
      <div class="card-footer" hidden>
        <button type="button" class="btn btn-primary btn-sm btn-block" data-extra="${id}" aria-pressed="false" aria-label="${escapeHtml(p.name)}: ekstra olarak ekle">Ekstra olarak ekle</button>
      </div>
    </article>`;
}
