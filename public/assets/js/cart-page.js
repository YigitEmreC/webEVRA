// "Siparişim" page (/cart.html): the chosen package, the extra products and the
// request form. There is no online payment: the form is e-mailed to the sales
// inbox by /api/order, and we call the customer to plan the installation.

import { getOrder, removeExtra, clearOrder, onOrderChange } from "./cart-store.js";
import { findItem, formatMoney, toCents } from "./pricing.js";
import { escapeHtml, icon, mediaHtml } from "./ui.js";

export function initCartPage() {
  const layout = document.getElementById("order-layout");
  if (!layout) return;

  const empty = document.getElementById("order-empty");
  const summary = document.getElementById("order-summary");
  const form = document.getElementById("order-form");
  const pkgInput = form.querySelector("[data-order-package]");
  const extrasInput = form.querySelector("[data-order-extras]");

  function render() {
    const order = getOrder();
    const pkg = order.package ? findItem(order.package) : null;
    const valid = pkg && pkg.kind === "package";
    empty.hidden = Boolean(valid);
    layout.hidden = !valid;
    if (!valid) return;

    const extras = order.extras.map((id) => findItem(id)).filter((item) => item && item.kind === "product");
    pkgInput.value = pkg.id;
    extrasInput.value = extras.map((item) => item.id).join(",");

    summary.innerHTML = `
      <h2>Sipariş özeti</h2>
      <div class="order-package">
        <p class="cart-line-kind">Seçilen paket</p>
        <div class="order-package-row">
          <h3>${escapeHtml(pkg.name)}</h3>
          <span class="price">${formatMoney(toCents(pkg.price))}</span>
        </div>
        <a class="text-link" href="/packages.html">Paketi değiştir</a>
      </div>

      <div class="order-extras">
        <p class="cart-line-kind">Ekstra ürünler (${extras.length})</p>
        ${
          extras.length
            ? `<ul class="extra-list">${extras
                .map(
                  (item) => `
                <li>
                  <span class="extra-media">${mediaHtml(item)}</span>
                  <a href="/products.html#product-${escapeHtml(item.id)}">${escapeHtml(item.name)}</a>
                  <button type="button" class="link-btn" data-remove="${escapeHtml(item.id)}" aria-label="${escapeHtml(item.name)} çıkar">Çıkar</button>
                </li>`
                )
                .join("")}</ul>`
            : `<p class="muted">Ekstra ürün seçmediniz.</p>`
        }
        <a class="text-link" href="/products.html">${extras.length ? "Başka ürün ekle" : "Ekstra ürün ekle"}</a>
      </div>

      <p class="fine-print">${icon("check")}<span>Paket fiyatı KDV dahildir. Ekstra ürünlerin fiyatı sizinle iletişime geçtiğimizde birlikte belirlenir; ödeme ve kurulum tarihi bu görüşmede netleşir.</span></p>`;
  }

  summary.addEventListener("click", (e) => {
    const button = e.target.closest("[data-remove]");
    if (button) removeExtra(button.dataset.remove);
  });

  // forms.js sends the form; once it succeeded, the request is done.
  form.addEventListener("form:success", clearOrder);

  render();
  onOrderChange(render);
}
