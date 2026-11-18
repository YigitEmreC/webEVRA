// Package cards: the full list on the Packages page (#package-list) and the
// featured ones on the home page (#featured-packages).

import { packages } from "../../data/catalog.js";
import { findItem, formatMoney, packageValueCents, toCents } from "./pricing.js";
import { addToCart } from "./cart-store.js";
import { escapeHtml, icon, toast } from "./ui.js";

const COMPACT_ITEMS = 4;

export function initPackages() {
  const full = document.getElementById("package-list");
  const featured = document.getElementById("featured-packages");
  if (full) render(full, packages, false);
  if (featured) render(featured, packages.filter((p) => p.featured), true);

  // Opened from a link like /packages.html#package-comfort
  if (full && location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

function render(root, list, compact) {
  root.innerHTML = list.map((p) => card(p, compact)).join("");
  root.addEventListener("click", (e) => {
    const button = e.target.closest("[data-add], [data-order]");
    if (!button) return;
    const pkg = packages.find((p) => p.id === (button.dataset.add || button.dataset.order));
    addToCart(pkg.id, 1);
    if (button.dataset.order) location.href = "/cart.html";
    else toast(`${pkg.name} package added to your cart`, { href: "/cart.html", text: "View cart" });
  });
}

function card(p, compact) {
  const price = toCents(p.price);
  const value = packageValueCents(p);
  const items = p.items
    .map(({ id, qty }) => ({ item: findItem(id), qty }))
    .filter(({ item }) => item);
  const shown = compact ? items.slice(0, COMPACT_ITEMS) : items;
  const more = items.length - shown.length;

  const included = shown
    .map(({ item, qty }) => `<li><span class="qty">${qty}×</span>${escapeHtml(item.name)}</li>`)
    .join("");
  const highlights = (p.highlights || [])
    .map((h) => `<li>${icon("check")}<span>${escapeHtml(h)}</span></li>`)
    .join("");

  return `
    <article class="card package-card${p.badge ? " is-highlighted" : ""}" id="package-${escapeHtml(p.id)}">
      <div class="card-body">
        ${p.badge ? `<span class="badge">${escapeHtml(p.badge)}</span>` : ""}
        <h3 class="card-title package-name">${escapeHtml(p.name)}</h3>
        <p class="card-kicker-plain">${escapeHtml(p.context)}</p>
        <p class="package-price">
          <span class="price price-lg">${formatMoney(price)}</span>
          ${value > price ? `<span class="price-was">Worth ${formatMoney(value)} separately</span>` : ""}
        </p>
        ${compact ? "" : `<p class="card-text">${escapeHtml(p.description)}</p>`}
        <h4 class="list-title">What's included</h4>
        <ul class="included-list">${included}${more > 0 ? `<li class="muted">+ ${more} more</li>` : ""}</ul>
        ${highlights && !compact ? `<ul class="check-list">${highlights}</ul>` : ""}
      </div>
      <div class="card-footer card-footer-stack">
        <button type="button" class="btn btn-primary" data-order="${escapeHtml(p.id)}">Order now</button>
        ${
          compact
            ? `<a class="btn btn-secondary" href="/packages.html#package-${escapeHtml(p.id)}">See details</a>`
            : `<button type="button" class="btn btn-secondary" data-add="${escapeHtml(p.id)}">Add to cart</button>`
        }
      </div>
    </article>`;
}
