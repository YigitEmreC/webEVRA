// "Siparişim" page (/cart.html): the chosen package, the extra products (with
// quantities) and the request form. There is no online payment: the form is
// e-mailed to the sales inbox by /api/order, and we call the customer to agree
// the extras' price and plan the installation.

import { getOrder, setExtraQty, removeExtra, clearOrder, extrasCount, onOrderChange, MAX_QTY } from "./cart-store.js";
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
    const focusKey = document.activeElement?.dataset?.focusKey;
    const order = getOrder();
    const pkg = order.package ? findItem(order.package) : null;
    const valid = pkg && pkg.kind === "package";
    empty.hidden = Boolean(valid);
    layout.hidden = !valid;
    if (!valid) return;

    const extras = order.extras
      .map(({ id, qty }) => ({ item: findItem(id), qty }))
      .filter(({ item }) => item && item.kind === "product");
    const count = extrasCount({ extras: extras.map(({ item, qty }) => ({ id: item.id, qty })) });
    pkgInput.value = pkg.id;
    // Sent as "id:qty,id:qty"
    extrasInput.value = extras.map(({ item, qty }) => `${item.id}:${qty}`).join(",");

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
        <p class="cart-line-kind">Ekstra ürünler (${count})</p>
        ${
          extras.length
            ? `<ul class="extra-list">${extras.map(extraHtml).join("")}</ul>`
            : `<p class="muted">Ekstra ürün seçmediniz.</p>`
        }
        <a class="text-link" href="/products.html">${extras.length ? "Başka ürün ekle" : "Ekstra ürün ekle"}</a>
      </div>

      <div class="order-total">
        <span>Toplam</span>
        <span class="price">${formatMoney(toCents(pkg.price))}${count ? `<span class="order-total-extra">+ ek ürün fiyatları</span>` : ""}</span>
      </div>

      <p class="fine-print">${icon("check")}<span>Paket fiyatı KDV dahildir. ${count ? "Ek ürünlerin fiyatı" : "Ekstra ürün eklerseniz fiyatı"} sizinle iletişime geçtiğimizde birlikte belirlenir; ödeme ve kurulum tarihi bu görüşmede netleşir.</span></p>`;

    if (focusKey) summary.querySelector(`[data-focus-key="${focusKey}"]`)?.focus();
  }

  function extraHtml({ item, qty }) {
    const id = escapeHtml(item.id);
    const name = escapeHtml(item.name);
    return `
      <li>
        <span class="extra-media">${mediaHtml(item)}</span>
        <div class="extra-info">
          <a href="/products.html#product-${id}">${name}</a>
          <div class="extra-controls">
            <div class="stepper stepper-sm" role="group" aria-label="${name}: adet">
              <button type="button" data-qty="${id}" data-delta="-1" data-focus-key="dec-${id}" aria-label="Bir azalt">−</button>
              <output>${qty}</output>
              <button type="button" data-qty="${id}" data-delta="1" data-focus-key="inc-${id}" aria-label="Bir artır" ${qty >= MAX_QTY ? "disabled" : ""}>+</button>
            </div>
            <button type="button" class="link-btn" data-remove="${id}" aria-label="${name} çıkar">Çıkar</button>
          </div>
        </div>
      </li>`;
  }

  summary.addEventListener("click", (e) => {
    const step = e.target.closest("[data-qty]");
    if (step) {
      const current = getOrder().extras.find((x) => x.id === step.dataset.qty)?.qty || 0;
      setExtraQty(step.dataset.qty, current + Number(step.dataset.delta));
      return;
    }
    const remove = e.target.closest("[data-remove]");
    if (remove) removeExtra(remove.dataset.remove);
  });

  // forms.js sends the form; once it succeeded, the request is done.
  form.addEventListener("form:success", clearOrder);

  render();
  onOrderChange(render);
}
