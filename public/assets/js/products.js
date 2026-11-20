// Products page: renders public/data/catalog.js with category filters and search.
// Products are not sold on their own:
//  • No package chosen yet → the page is a catalogue, with a prompt to pick a package.
//  • Package chosen → each product can be added as an extra, and a bar at the
//    bottom leads to the request form (/cart.html). Extras have no price on the
//    site; it is agreed with the customer when we call them.
// The chosen category and search text are kept in the URL (?kategori=…&ara=…).
// ?paket=genel-ev shows only the products inside that package (linked from the Packages page).
// With an own package ("Kendi paketini oluştur") the buttons change the package
// itself, and the bar shows its exact price (builder-core.js).

import { products } from "../../data/catalog.js";
import { findItem, formatMoney, toCents } from "./pricing.js";
import { getOrder, extraQty, extrasCount, setExtraQty, customQty, setCustomQty, onOrderChange, MAX_QTY } from "./cart-store.js";
import { orderPackage, minQty, CUSTOM_MAX_QTY } from "./builder-core.js";
import { escapeHtml, icon, mediaHtml, toast } from "./ui.js";
import { switcherHtml, removeButtonHtml, bindSwitcher } from "./package-switcher.js";

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
  const pkgParam = findItem(params.get("paket") || "");
  let pkgFilter = pkgParam && pkgParam.kind === "package" ? pkgParam : null;
  const inPackage = (p) => !pkgFilter || pkgFilter.items.some((i) => i.id === p.id);

  filters.innerHTML = [ALL, ...categories]
    .map(
      (c) => `<button type="button" class="chip" data-category="${escapeHtml(c)}" aria-pressed="${c === active}">
        ${c === ALL ? "Tümü" : escapeHtml(c)} <span class="chip-count" data-count-for="${escapeHtml(c)}"></span>
      </button>`
    )
    .join("");

  list.innerHTML = products.map(card).join("");
  revealOnScroll(list);

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
      if (!matchesSearch(p, words) || !inPackage(p)) continue;
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
      const visible = (active === ALL || p.category === active) && matchesSearch(p, words) && inPackage(p);
      el.hidden = !visible;
      if (visible) shown++;
    }

    const filtered = active !== ALL || words.length > 0 || pkgFilter;
    const pkgNote = pkgFilter
      ? `<span class="pkg-filter">${icon("layers")}<strong>${escapeHtml(pkgFilter.name)}</strong> içindeki ürünler</span> `
      : "";
    count.innerHTML = filtered
      ? `${pkgNote}${shown} / ${products.length} ürün gösteriliyor <button type="button" class="link-button" data-clear>Filtreleri temizle</button>`
      : `${products.length} ürün`;
    empty.hidden = shown > 0;

    const next = new URLSearchParams();
    if (active !== ALL) next.set("kategori", active);
    if (search.value.trim()) next.set("ara", search.value.trim());
    if (pkgFilter) next.set("paket", pkgFilter.id);
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
    pkgFilter = null;
    setCategory(ALL);
    search.focus();
  }

  /** Banner, card buttons and bottom bar follow the visitor's package request. */
  function syncOrder() {
    const order = getOrder();
    const pkg = orderPackage(order);
    const choosing = Boolean(pkg);
    const own = Boolean(pkg?.custom);
    const included = new Set(choosing ? pkg.items.map((i) => i.id) : []);

    banner.innerHTML = choosing
      ? `<div class="mode-banner is-active is-stacked">
          <div class="mode-head">
            <p class="mode-title">${icon("check")}<span>Paketiniz: <strong>${escapeHtml(pkg.name)}</strong></span></p>
            ${removeButtonHtml()}
          </div>
          <p class="muted">${
            own
              ? "Aşağıdan ürün ekleyip çıkararak paketinizi değiştirebilirsiniz; fiyat anında güncellenir. Başka bir pakete geçmek için birine dokunun."
              : "Paketi değiştirmek için aşağıdan birine dokunun; seçtiğiniz ekstra ürünler korunur. Ekstra ürünlerin fiyatı sizinle iletişime geçtiğimizde birlikte belirlenir."
          }</p>
          ${switcherHtml(pkg.id)}
          <div class="mode-actions">
            <a class="btn btn-primary" href="/cart.html">Devam et</a>
            ${
              own
                ? `<a class="text-link" href="/packages.html?duzenle=1#kendin-kur">Paketimi düzenle</a>`
                : `<a class="text-link" href="/packages.html#package-${escapeHtml(pkg.id)}">Paket detayları</a>`
            }
          </div>
        </div>`
      : `<div class="mode-banner">
          <div>
            <p class="mode-title">${icon("layers")}<span>Ürünler tek başına satılmaz</span></p>
            <p class="muted">Önce bir paket seçin. Paketinizi seçtikten sonra bu sayfadan dilediğiniz ürünleri ekstra olarak ekleyebilirsiniz.</p>
          </div>
          <div class="mode-actions">
            <a class="btn btn-primary" href="/packages.html">Evime uygun paketi keşfet</a>
          </div>
        </div>`;

    const focusKey = document.activeElement?.dataset?.focusKey;
    list.querySelectorAll(".product-card").forEach((el) => {
      const id = el.dataset.id;
      const name = escapeHtml(byId.get(id).name);
      const footer = el.querySelector(".card-footer");
      el.querySelector("[data-included]").hidden = own || !included.has(id);
      footer.hidden = !choosing;
      if (!choosing) return;
      const qty = own ? customQty(id, order) : extraQty(id, order);
      const min = own ? minQty(order.custom, id) : 0;
      const max = own ? CUSTOM_MAX_QTY : MAX_QTY;
      const key = `${own}:${qty}`; // redraw the card only when its quantity changed
      if (footer.dataset.state === key) return; // nothing changed on this card
      footer.dataset.state = key;
      footer.innerHTML = qty
        ? `<div class="qty-row">
            <div class="stepper" role="group" aria-label="${name}: ekstra adet">
              <button type="button" data-qty="${escapeHtml(id)}" data-delta="-1" data-focus-key="dec-${escapeHtml(id)}" aria-label="${qty === 1 ? "Çıkar" : "Bir azalt"}" ${qty <= min ? "disabled" : ""}>−</button>
              <output>${qty}</output>
              <button type="button" data-qty="${escapeHtml(id)}" data-delta="1" data-focus-key="inc-${escapeHtml(id)}" aria-label="Bir artır" ${qty >= max ? "disabled" : ""}>+</button>
            </div>
            <span class="qty-label">${icon("check")} ${own ? (min ? "paketinizde (zorunlu)" : "paketinizde") : "ekstra olarak eklendi"}</span>
          </div>`
        : `<button type="button" class="btn btn-primary btn-sm btn-block" data-qty="${escapeHtml(id)}" data-delta="1" data-focus-key="dec-${escapeHtml(id)}" aria-label="${name}: ${own ? "paketime ekle" : "ekstra olarak ekle"}">${own ? "Paketime ekle" : "Ekstra olarak ekle"}</button>`;
    });
    if (focusKey) list.querySelector(`[data-focus-key="${focusKey}"]`)?.focus();

    bar.hidden = !choosing;
    document.body.classList.toggle("has-order-bar", choosing);
    if (choosing) {
      const n = own ? 0 : extrasCount(order);
      const count = own ? pkg.items.reduce((sum, i) => sum + i.qty, 0) : 0;
      bar.innerHTML = `
        <div class="container order-bar-inner">
          <p>
            <strong>${escapeHtml(pkg.name)}</strong><span class="muted"> · ${own ? `${count} ürün, kurulum ve KDV dahil` : n ? `${n} ekstra ürün` : "ekstra ürün yok"}</span><br>
            <span class="order-bar-price">${formatMoney(toCents(pkg.price))}${n ? ` <span class="muted">+ ek ürün fiyatları</span>` : ""}</span>
          </p>
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
    const button = e.target.closest("[data-qty]");
    if (!button) return;
    const p = byId.get(button.dataset.qty);
    const own = getOrder().package && orderPackage(getOrder())?.custom;
    const before = own ? customQty(p.id) : extraQty(p.id);
    if (own) setCustomQty(p.id, before + Number(button.dataset.delta));
    else setExtraQty(p.id, Math.max(0, Math.min(before + Number(button.dataset.delta), MAX_QTY)));
    const after = own ? customQty(p.id) : extraQty(p.id);
    if (before === 0 && after > 0) toast(`${p.name} ${own ? "paketinize eklendi" : "ekstra olarak eklendi"}`, { href: "/cart.html", text: "Siparişim" });
    else if (after === 0 && before > 0) toast(`${p.name} çıkarıldı`);
  });

  bindSwitcher(banner);
  // A package filter (?paket=…) follows the chosen package: switching to another
  // package shows that package's products; removing the package clears it.
  let lastPackage = getOrder().package;
  onOrderChange(() => {
    syncOrder();
    const current = getOrder().package;
    if (current === lastPackage) return;
    lastPackage = current;
    if (!pkgFilter) return;
    pkgFilter = orderPackage(getOrder());
    apply();
  });
  syncOrder();
  apply();

  // Opened from a link like /products.html#product-smart-plug
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
}

const CONNECTION = /zigbee|wi-?fi|matter|thread/i;

/** A full-width panel: blurred product photo behind, the original photo in a
    small box, and the product's specs next to it. */
function card(p) {
  const id = escapeHtml(p.id);
  const features = p.features || [];
  const connection = features.filter((f) => CONNECTION.test(f));
  const other = features.filter((f) => !CONNECTION.test(f));
  const [type, model] = p.name.includes(" – ") ? p.name.split(" – ") : [p.name, ""];
  const specs = [
    ["Ürün", type],
    ["Model", model],
    ["Kategori", p.category],
    ["Bağlantı", connection.join(" · ")],
    ["Özellikler", other.join(" · ")],
  ].filter(([, value]) => value);
  const bg = p.image ? ` style="--panel-bg: url('${escapeHtml(p.image)}')"` : "";

  return `
    <article class="product-panel product-card${p.image ? "" : " no-image"}" data-id="${id}" id="product-${id}"${bg}>
      <div class="panel-bg" aria-hidden="true"></div>
      <div class="panel-media">${mediaHtml(p)}</div>
      <div class="panel-body">
        <p class="card-kicker">${escapeHtml(p.category)} <span class="included-tag" data-included hidden>Paketinizde var</span></p>
        <h3 class="panel-title">${escapeHtml(p.name)}</h3>
        <dl class="panel-specs">
          ${specs.map(([label, value]) => `<div><dt>${label}</dt><dd>${escapeHtml(value)}</dd></div>`).join("")}
        </dl>
        <p class="panel-desc">${escapeHtml(p.description)}</p>
        <div class="card-footer" hidden></div>
      </div>
    </article>`;
}

/** Panels slide in as they scroll into view (skipped for reduced motion). */
function revealOnScroll(list) {
  if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-in");
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -8% 0px" }
  );
  list.classList.add("reveal");
  list.querySelectorAll(".product-panel").forEach((el) => observer.observe(el));
}
