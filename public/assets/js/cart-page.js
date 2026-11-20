// "Siparişim" page (/cart.html): the chosen package, the extra products (with
// quantities) and the request form. The customer pays a 20% deposit (kapora) by
// bank transfer first and confirms it in the form; the form is e-mailed to the
// sales inbox by /api/order, and we call the customer to agree the extras' price
// and plan the installation.
// An own package ("Kendi paketini oluştur") has an exact price and no extras:
// its products are listed instead, with a link back to the builder.

import { getOrder, setExtraQty, removeExtra, clearOrder, extrasCount, onOrderChange, MAX_QTY } from "./cart-store.js";
import { orderPackage, sizeOf, heatingOf, balconyText, roomSummary } from "./builder-core.js";
import { findItem, formatMoney, toCents, depositCents } from "./pricing.js";
import { settings } from "../../data/settings.js";
import { escapeHtml, icon, typeTileHtml } from "./ui.js";
import { switcherHtml, removeButtonHtml, bindSwitcher } from "./package-switcher.js";

export function initCartPage() {
  const layout = document.getElementById("order-layout");
  if (!layout) return;

  const empty = document.getElementById("order-empty");
  const summary = document.getElementById("order-summary");
  const form = document.getElementById("order-form");
  const pkgInput = form.querySelector("[data-order-package]");
  const extrasInput = form.querySelector("[data-order-extras]");
  const customInput = form.querySelector("[data-order-custom]");
  const depositBox = form.querySelector("[data-deposit]");

  function render() {
    const focusKey = document.activeElement?.dataset?.focusKey;
    const order = getOrder();
    const pkg = orderPackage(order);
    const valid = Boolean(pkg);
    empty.hidden = Boolean(valid);
    layout.hidden = !valid;
    if (!valid) return;

    const extras = (pkg.custom ? [] : order.extras)
      .map(({ id, qty }) => ({ item: findItem(id), qty }))
      .filter(({ item }) => item && item.kind === "product");
    const count = extrasCount({ extras: extras.map(({ item, qty }) => ({ id: item.id, qty })) });
    pkgInput.value = pkg.id;
    // Sent as "id:qty,id:qty"
    extrasInput.value = extras.map(({ item, qty }) => `${item.id}:${qty}`).join(",");
    customInput.value = pkg.custom ? JSON.stringify({ size: pkg.size, balconies: pkg.balconies, heating: pkg.heating, items: pkg.items, placements: pkg.placements, answers: pkg.answers }) : "";

    summary.innerHTML = `
      <h2>Sipariş özeti</h2>
      <div class="order-package">
        <div class="order-package-row">
          <p class="cart-line-kind">Paketiniz</p>
          ${removeButtonHtml()}
        </div>
        ${switcherHtml(pkg.id)}
        <p class="hint-small">Değiştirmek için bir pakete dokunun; ${pkg.custom ? "kendi paketiniz kayıtlı kalır." : "ekstra ürünleriniz korunur."} ${
          pkg.custom ? `<a href="/packages.html?duzenle=1#kendin-kur">Paketimi düzenle</a>` : `<a href="/packages.html#package-${escapeHtml(pkg.id)}">Paket detayları</a>`
        }</p>
      </div>

      ${pkg.custom ? customHtml(pkg) : `<div class="order-extras">
        <p class="cart-line-kind">Ekstra ürünler (${count})</p>
        ${
          extras.length
            ? `<ul class="extra-list">${extras.map(extraHtml).join("")}</ul>`
            : `<p class="muted">Ekstra ürün seçmediniz.</p>`
        }
        <a class="text-link" href="/products.html">${extras.length ? "Başka ürün ekle" : "Ekstra ürün ekle"}</a>
      </div>`}

      <div class="order-total">
        <span>Toplam</span>
        <span class="price">${formatMoney(toCents(pkg.price))}${count ? `<span class="order-total-extra">+ ek ürün fiyatları</span>` : ""}</span>
      </div>
      <div class="order-deposit">
        <span>Şimdi ödenecek kapora (%${Math.round(settings.payment.depositRate * 100)})</span>
        <strong>${formatMoney(depositCents(pkg))}</strong>
      </div>

      <p class="fine-print">${icon("check")}<span>${
        pkg.custom
          ? "Fiyata ürünler, elektrikçi ve kurulum hizmeti, ulaşım, garanti ve %20 KDV dahildir. Kalan tutar ve kurulum tarihi sizi aradığımızda netleşir."
          : `Paket fiyatı KDV dahildir. ${count ? "Ek ürünlerin fiyatı" : "Ekstra ürün eklerseniz fiyatı"} sizinle iletişime geçtiğimizde birlikte belirlenir; kalan tutar ve kurulum tarihi bu görüşmede netleşir.`
      }</span></p>`;

    renderDeposit(pkg);

    if (focusKey) summary.querySelector(`[data-focus-key="${focusKey}"]`)?.focus();
  }

  /** Amount, bank details and what to write in the transfer description. */
  function renderDeposit(pkg) {
    const { bankName, accountName, iban } = settings.payment;
    depositBox.innerHTML = `
      <p class="deposit-amount"><span>Gönderilecek tutar</span><strong>${formatMoney(depositCents(pkg))}</strong></p>
      <dl class="deposit-bank">
        <div><dt>Banka</dt><dd>${escapeHtml(bankName)}</dd></div>
        <div><dt>Hesap sahibi</dt><dd>${escapeHtml(accountName)}</dd></div>
        <div><dt>IBAN</dt><dd><span class="iban" data-iban>${escapeHtml(iban)}</span> <button type="button" class="link-button" data-copy-iban>Kopyala</button></dd></div>
        <div><dt>Açıklama</dt><dd>Adınız soyadınız ve "${escapeHtml(pkg.name)}"</dd></div>
      </dl>`;
  }

  depositBox.addEventListener("click", async (e) => {
    const button = e.target.closest("[data-copy-iban]");
    if (!button) return;
    const iban = settings.payment.iban.replace(/\s+/g, "");
    try {
      await navigator.clipboard.writeText(iban);
      button.textContent = "Kopyalandı";
    } catch {
      button.textContent = "Kopyalanamadı";
    }
    setTimeout(() => (button.textContent = "Kopyala"), 2000);
  });

  /** The own package's products (edited in the builder or on the Products page). */
  function customHtml(pkg) {
    const count = pkg.items.reduce((sum, i) => sum + i.qty, 0);
    // Grouped by room of the floor plan; products without a room come last.
    const { rooms, unplaced } = roomSummary(pkg);
    const groups = [...rooms.map((r) => ({ label: r.label, items: r.items })), ...(unplaced.length ? [{ label: rooms.length ? "Odası seçilmemiş" : "Ürünler", items: unplaced }] : [])];
    return `
      <div class="order-extras">
        <p class="cart-line-kind">Paketinizdeki ürünler (${count})</p>
        <p class="muted">${escapeHtml(sizeOf(pkg.size).label)} ev${escapeHtml(balconyText(pkg.balconies, ", "))} · ${escapeHtml(heatingOf(pkg.heating).name)}</p>
        ${groups
          .map(
            ({ label, items }) => `
          <p class="order-room">${escapeHtml(label)}</p>
          <ul class="pkg-items">
            ${items
              .map(({ item, qty }) => `<li>${typeTileHtml(item)}<a href="/products.html#product-${escapeHtml(item.id)}">${escapeHtml(item.name)}</a><span class="pkg-qty">${qty}×</span></li>`)
              .join("")}
          </ul>`
          )
          .join("")}
        <a class="text-link" href="/packages.html?duzenle=1#kendin-kur">Paketimi düzenle</a>
      </div>`;
  }

  function extraHtml({ item, qty }) {
    const id = escapeHtml(item.id);
    const name = escapeHtml(item.name);
    return `
      <li>
        ${typeTileHtml(item)}
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

  bindSwitcher(summary);

  // forms.js sends the form; once it succeeded, the request is done.
  form.addEventListener("form:success", clearOrder);

  render();
  onOrderChange(render);
}
