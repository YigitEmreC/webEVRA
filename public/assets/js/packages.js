// Package cards: the full list on the Packages page (#package-list) and the
// featured ones on the home page (#featured-packages).
// "Bu paketi seç" saves the package as the visitor's request and opens the
// Products page, where extra products can be added before sending the request.

import { packages } from "../../data/catalog.js";
import { formatMoney, packageValueCents, toCents } from "./pricing.js";
import { getOrder, setPackage, onOrderChange } from "./cart-store.js";
import { escapeHtml, icon } from "./ui.js";

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
  const draw = () => {
    const selected = getOrder().package;
    root.innerHTML = list.map((p) => card(p, compact, p.id === selected)).join("");
  };
  draw();
  onOrderChange(draw);

  root.addEventListener("click", (e) => {
    const button = e.target.closest("[data-choose]");
    if (!button) return;
    setPackage(button.dataset.choose);
    location.href = "/products.html";
  });
}

function card(p, compact, selected) {
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
        ${compact ? "" : `<p class="card-text">${escapeHtml(p.description)}</p>`}
        ${highlights ? `<h4 class="list-title">Özellikler</h4><ul class="check-list">${highlights}</ul>` : ""}
        ${more > 0 ? `<p class="muted">+ ${more} özellik daha</p>` : ""}
      </div>
      <div class="card-footer card-footer-stack">
        ${
          selected
            ? `<a class="btn btn-primary" href="/products.html">Ekstra ürün seçimine devam et</a>`
            : `<button type="button" class="btn btn-primary" data-choose="${id}">Bu paketi seç</button>`
        }
        ${compact ? `<a class="btn btn-secondary" href="/packages.html#package-${id}">Detaylar</a>` : ""}
      </div>
    </article>`;
}
