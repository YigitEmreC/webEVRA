// Products page: renders public/data/catalog.js with category filters and search.
// The chosen category and search text are kept in the URL (?kategori=…&ara=…)
// so a filtered list can be shared or bookmarked.

import { products } from "../../data/catalog.js";
import { addToCart, getCart, onCartChange } from "./cart-store.js";
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

  function syncInCart() {
    const inCart = new Map(getCart().map((i) => [i.id, i.qty]));
    list.querySelectorAll("[data-in-cart]").forEach((el) => {
      const qty = inCart.get(el.dataset.inCart) || 0;
      el.textContent = qty ? `${qty} in cart` : "";
    });
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
          <span class="in-cart" data-in-cart="${escapeHtml(p.id)}"></span>
        </div>
        <button type="button" class="btn btn-primary btn-sm" data-add="${escapeHtml(p.id)}" aria-label="Add ${escapeHtml(p.name)} to cart">
          ${icon("cart")} Add to cart
        </button>
      </div>
    </article>`;
}
