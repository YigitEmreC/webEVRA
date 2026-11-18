// Cart page: line items, quantities, totals and the hand-off to Stripe Checkout.
// Card details are never typed into this site: the customer pays on Stripe's
// secure payment page and is sent back to /order-success.html afterwards.

import { getCart, setQty, removeFromCart, onCartChange } from "./cart-store.js";
import { priceCart, formatMoney, toCents } from "./pricing.js";
import { settings } from "../../data/settings.js";
import { escapeHtml, icon, mediaHtml } from "./ui.js";

export function initCartPage() {
  const root = document.getElementById("cart");
  if (!root) return;

  let termsAccepted = false;

  function render() {
    const focusKey = document.activeElement?.dataset?.focusKey;
    const cart = priceCart(getCart());

    if (!cart.lines.length) {
      root.innerHTML = `
        <div class="card empty-state">
          <span class="feature-icon">${icon("cart")}</span>
          <h2>Your cart is empty</h2>
          <p class="muted">Browse our products or pick a complete package.</p>
          <div class="actions actions-center">
            <a class="btn btn-primary" href="/packages.html">View packages</a>
            <a class="btn btn-secondary" href="/products.html">Browse products</a>
          </div>
        </div>`;
      return;
    }

    const { fee, freeFrom } = settings.shipping;
    const toFree = freeFrom != null && fee ? toCents(freeFrom) - cart.subtotalCents : 0;

    root.innerHTML = `
      <div class="cart-layout">
        <section class="card cart-lines" aria-label="Items in your cart">
          ${cart.lines.map(lineHtml).join("")}
        </section>
        <aside class="card summary" aria-labelledby="summary-title">
          <h2 id="summary-title">Order summary</h2>
          <dl class="summary-rows">
            <div><dt>Subtotal</dt><dd>${formatMoney(cart.subtotalCents)}</dd></div>
            <div><dt>${escapeHtml(settings.shipping.label)}</dt><dd>${cart.shippingCents ? formatMoney(cart.shippingCents) : "Free"}</dd></div>
            <div class="summary-total"><dt>Total</dt><dd>${formatMoney(cart.totalCents)}</dd></div>
          </dl>
          ${toFree > 0 ? `<p class="hint">Add ${formatMoney(toFree)} more for free delivery.</p>` : ""}
          <label class="checkbox">
            <input type="checkbox" id="accept-terms" ${termsAccepted ? "checked" : ""}>
            <span>I agree to the <a href="/terms.html">terms and conditions</a></span>
          </label>
          <button type="button" class="btn btn-primary btn-block" id="checkout-btn">Go to secure checkout</button>
          <p class="status is-error" id="checkout-status" role="alert" hidden></p>
          <p class="fine-print">${icon("check")}<span>You enter your payment details on Stripe's secure payment page. Prices include VAT.</span></p>
        </aside>
      </div>`;

    if (focusKey) root.querySelector(`[data-focus-key="${focusKey}"]`)?.focus();
  }

  function lineHtml({ item, quantity, unitCents, totalCents }) {
    const id = escapeHtml(item.id);
    const name = escapeHtml(item.name);
    const href = item.kind === "package" ? `/packages.html#package-${id}` : `/products.html#product-${id}`;
    return `
      <div class="cart-line">
        <div class="cart-line-media">${mediaHtml(item)}</div>
        <div class="cart-line-info">
          <p class="cart-line-kind">${item.kind === "package" ? "Package" : escapeHtml(item.category)}</p>
          <h3><a href="${href}">${name}</a></h3>
          <p class="muted">${formatMoney(unitCents)} each</p>
        </div>
        <div class="stepper" role="group" aria-label="Quantity of ${name}">
          <button type="button" data-action="dec" data-id="${id}" data-focus-key="dec-${id}" aria-label="One less">−</button>
          <output>${quantity}</output>
          <button type="button" data-action="inc" data-id="${id}" data-focus-key="inc-${id}" aria-label="One more">+</button>
        </div>
        <p class="cart-line-total">${formatMoney(totalCents)}</p>
        <button type="button" class="link-btn" data-action="remove" data-id="${id}">Remove</button>
      </div>`;
  }

  root.addEventListener("click", (e) => {
    const button = e.target.closest("[data-action]");
    if (button) {
      const { action, id } = button.dataset;
      const current = getCart().find((i) => i.id === id)?.qty || 0;
      if (action === "inc") setQty(id, current + 1);
      if (action === "dec") setQty(id, current - 1);
      if (action === "remove") removeFromCart(id);
      return;
    }
    if (e.target.closest("#checkout-btn")) checkout();
  });

  root.addEventListener("change", (e) => {
    if (e.target.id === "accept-terms") termsAccepted = e.target.checked;
  });

  async function checkout() {
    const button = root.querySelector("#checkout-btn");
    const status = root.querySelector("#checkout-status");
    const showError = (message) => {
      status.textContent = message;
      status.hidden = false;
    };

    if (!termsAccepted) {
      showError("Please accept the terms and conditions first.");
      root.querySelector("#accept-terms").focus();
      return;
    }

    status.hidden = true;
    button.disabled = true;
    button.textContent = "Opening secure checkout…";
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: getCart() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) throw new Error(data.error || "Checkout isn't available right now. Please try again later or contact us.");
      window.location.assign(data.url);
    } catch (err) {
      showError(err.message);
      button.disabled = false;
      button.textContent = "Go to secure checkout";
    }
  }

  render();
  onCartChange(render);
}
