// Package cards: the full list on the Packages page (#package-list) and the
// featured ones on the home page (#featured-packages).
// "Bu paketi seç" saves the package as the visitor's request and opens the
// Products page, where extra products can be added before sending the request.

import { packages } from "../../data/catalog.js";
import { findItem, formatMoney, packageValueCents, toCents } from "./pricing.js";
import { getOrder, onOrderChange } from "./cart-store.js";
import { removeButtonHtml, bindSwitcher } from "./package-switcher.js";
import { escapeHtml, icon, typeTileHtml } from "./ui.js";

const COMPACT_ITEMS = 4;

export function initPackages() {
  const full = document.getElementById("package-list");
  const featured = document.getElementById("featured-packages");
  if (full) render(full, packages, false);
  if (featured) render(featured, packages.filter((p) => p.featured), true);

  // Opened from a link like /packages.html#package-yasli
  if (full && location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

function render(root, list, compact) {
  // The package named in the address (#package-yasli) opens its product list.
  let openIds = new Set(location.hash.startsWith("#package-") ? [location.hash.slice(9)] : []);
  const draw = () => {
    if (root.querySelector(".package-card")) openIds = new Set([...root.querySelectorAll("details[data-contents][open]")].map((d) => d.dataset.contents));
    const selected = getOrder().package;
    root.innerHTML =
      list.map((p) => card(p, compact, p.id === selected, Boolean(selected), openIds.has(p.id))).join("") +
      (compact ? "" : ownPackageCard());
  };
  draw();
  onOrderChange(draw);

  bindSwitcher(root); // "Paketi kaldır" on the selected card
  root.addEventListener("click", (e) => {
    const button = e.target.closest("[data-choose]");
    if (!button) return;
    // Open the package in the home-planning builder (same page if it's here).
    if (document.getElementById("builder")) {
      window.dispatchEvent(new CustomEvent("builder:template", { detail: button.dataset.choose }));
    } else {
      location.href = `/packages.html?sablon=${encodeURIComponent(button.dataset.choose)}#kendin-kur`;
    }
  });
}

function card(p, compact, selected, hasPackage, open) {
  const id = escapeHtml(p.id);
  const price = toCents(p.price);
  const value = packageValueCents(p);
  // Show the package's features (highlights), not the list of devices inside.
  const all = p.highlights || [];
  const shown = compact ? all.slice(0, COMPACT_ITEMS) : all;
  const more = all.length - shown.length;
  const highlights = shown.map((h) => `<li>${icon("check")}<span>${escapeHtml(h)}</span></li>`).join("");

  return `
    <article class="card package-card${p.badge || selected ? " is-highlighted" : ""}" id="package-${id}">
      <div class="card-body">
        ${selected ? `<span class="badge">Seçtiğiniz paket</span>` : p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : ""}
        <h3 class="card-title package-name">${escapeHtml(p.name)}</h3>
        <p class="card-kicker-plain">${escapeHtml(p.context)}</p>
        <p class="package-price">
          <span class="price price-lg">${formatMoney(price)}</span>
          ${value > price ? `<span class="price-was">Ayrı ayrı ${formatMoney(value)} değerinde</span>` : ""}
        </p>
        ${highlights ? `<h4 class="list-title">Özellikler</h4><ul class="check-list">${highlights}</ul>` : ""}
        ${more > 0 ? `<p class="muted">+ ${more} özellik daha</p>` : ""}
        ${compact ? "" : contentsHtml(p, open)}
      </div>
      <div class="card-footer card-footer-stack">
        ${
          selected
            ? `<a class="btn btn-primary" href="/products.html">Ekstra ürün seçimine devam et</a>`
            : `<button type="button" class="btn btn-primary" data-choose="${id}">${hasPackage ? "Bu pakete geç" : "Bu paketi seç"}</button>`
        }
        ${compact ? `<a class="btn btn-secondary" href="/packages.html#package-${id}">Detaylar</a>` : ""}
        ${selected ? removeButtonHtml() : ""}
      </div>
    </article>`;
}

/** Last tile of the list: an empty "make your own" package that leads to the builder. */
function ownPackageCard() {
  return `
    <a class="card package-card package-card-own" href="#kendin-kur">
      <span class="own-plus" aria-hidden="true">+</span>
      <h3 class="card-title package-name">Kendi paketini oluştur</h3>
      <p class="card-kicker-plain">Birkaç soruya cevap verin, ürünleri evinize göre biz önerelim.</p>
      <ul class="check-list">
        <li>${icon("check")}<span>Odanıza göre ürün seçimi</span></li>
        <li>${icon("check")}<span>Fiyatı anında görün</span></li>
      </ul>
      <span class="btn btn-secondary">Oluşturmaya başla →</span>
    </a>`;
}

/** The products inside a package, with quantities and links to the Products page. */
function contentsHtml(p, open) {
  const items = (p.items || []).map(({ id, qty }) => ({ item: findItem(id), qty })).filter(({ item }) => item);
  const total = items.reduce((sum, { qty }) => sum + qty, 0);
  return `
    <details class="pkg-contents" data-contents="${escapeHtml(p.id)}" ${open ? "open" : ""}>
      <summary>Paketteki ürünler <span class="muted">(${total} adet)</span></summary>
      <ul class="pkg-items">
        ${items
          .map(
            ({ item, qty }) => `
          <li>
            ${typeTileHtml(item)}
            <span>${escapeHtml(item.name)}</span>
            <span class="pkg-qty">${qty}×</span>
          </li>`
          )
          .join("")}
      </ul>
    </details>`;
}
