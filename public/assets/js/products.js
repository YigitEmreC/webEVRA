// Products page: renders public/data/catalog.js with category filters and search.

import { products } from "../../data/catalog.js";
import { formatMoney, toCents } from "./pricing.js";
import { addToCart, getCart, onCartChange } from "./cart-store.js";
import { escapeHtml, icon, mediaHtml, toast } from "./ui.js";

export function initProducts() {
  const list = document.getElementById("product-list");
  if (!list) return;

  const filters = document.getElementById("product-filters");
  const search = document.getElementById("product-search");
  const count = document.getElementById("product-count");
  const empty = document.getElementById("product-empty");
  const byId = new Map(products.map((p) => [p.id, p]));
  const categories = [...new Set(products.map((p) => p.category))];
  let active = "all";

  filters.innerHTML = ["all", ...categories]
    .map((c) => `<button type="button" class="chip" data-category="${escapeHtml(c)}" aria-pressed="${c === active}">${c === "all" ? "All products" : escapeHtml(c)}</button>`)
    .join("");

  list.innerHTML = products.map(card).join("");

  function apply() {
    const q = search.value.trim().toLowerCase();
    let shown = 0;
    for (const el of list.children) {
      const p = byId.get(el.dataset.id);
      const text = `${p.name} ${p.category} ${p.description} ${(p.features || []).join(" ")}`.toLowerCase();
      const visible = (active === "all" || p.category === active) && (!q || text.includes(q));
      el.hidden = !visible;
      if (visible) shown++;
    }
    count.textContent = `Showing ${shown} of ${products.length} products`;
    empty.hidden = shown > 0;
  }

  function syncInCart() {
    const inCart = new Map(getCart().map((i) => [i.id, i.qty]));
    list.querySelectorAll("[data-in-cart]").forEach((el) => {
      const qty = inCart.get(el.dataset.inCart) || 0;
      el.textContent = qty ? `${qty} in cart` : "";
    });
  }

  filters.addEventListener("click", (e) => {
    const button = e.target.closest("[data-category]");
    if (!button) return;
    active = button.dataset.category;
    filters.querySelectorAll(".chip").forEach((chip) => chip.setAttribute("aria-pressed", String(chip === button)));
    apply();
  });
  search.addEventListener("input", apply);
  list.addEventListener("click", (e) => {
    const button = e.target.closest("[data-add]");
    if (!button) return;
    const p = byId.get(button.dataset.add);
    addToCart(p.id, 1);
    toast(`${p.name} added to your cart`, { href: "/cart.html", text: "View cart" });
  });

  onCartChange(syncInCart);
  syncInCart();
  apply();

  // Opened from a link like /products.html#product-smart-plug (e.g. from the cart)
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

function card(p) {
  const features = (p.features || []).map((f) => `<li>${escapeHtml(f)}</li>`).join("");
  return `
    <article class="card product-card" data-id="${escapeHtml(p.id)}" id="product-${escapeHtml(p.id)}">
      <div class="card-media">${mediaHtml(p)}</div>
      <div class="card-body">
        <p class="card-kicker">${escapeHtml(p.category)}</p>
        <h3 class="card-title">${escapeHtml(p.name)}</h3>
        <p class="card-text">${escapeHtml(p.description)}</p>
        ${features ? `<ul class="tag-list">${features}</ul>` : ""}
      </div>
      <div class="card-footer">
        <div>
          <span class="price">${formatMoney(toCents(p.price))}</span>
          <span class="in-cart" data-in-cart="${escapeHtml(p.id)}"></span>
        </div>
        <button type="button" class="btn btn-primary btn-sm" data-add="${escapeHtml(p.id)}" aria-label="Add ${escapeHtml(p.name)} to cart">
          ${icon("cart")} Add to cart
        </button>
      </div>
    </article>`;
}
