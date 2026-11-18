// Entry point, loaded by every page. Each feature only switches on when its
// element is on the page, so one script tag works everywhere.

import { getCart, onCartChange, clearCart } from "./cart-store.js";
import { priceCart } from "./pricing.js";
import { ensureToast } from "./ui.js";
import { initProducts } from "./products.js";
import { initPackages } from "./packages.js";
import { initCartPage } from "./cart-page.js";
import { initForms } from "./forms.js";
import { initFaq } from "./faq.js";

const features = [initNav, initActiveLink, initCartBadge, initYear, ensureToast, initProducts, initPackages, initCartPage, initForms, initFaq, initOrderSuccess];

for (const init of features) {
  try {
    init();
  } catch (err) {
    console.error(`[site] ${init.name} failed:`, err);
  }
}

function initNav() {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("site-nav");
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("nav-open", open);
  };
  toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
  nav.addEventListener("click", (e) => e.target.closest("a") && setOpen(false));
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.classList.contains("nav-open")) {
      setOpen(false);
      toggle.focus();
    }
  });
  matchMedia("(min-width: 1000px)").addEventListener("change", () => setOpen(false));
}

function initActiveLink() {
  const norm = (path) => path.replace(/index(\.html)?$/, "").replace(/\.html$/, "").replace(/\/+$/, "") || "/";
  const here = norm(location.pathname);
  document.querySelectorAll(".site-nav a, .cart-link").forEach((a) => {
    if (norm(new URL(a.href).pathname) === here) a.setAttribute("aria-current", "page");
  });
}

function initCartBadge() {
  const badges = document.querySelectorAll("[data-cart-count]");
  const update = () => {
    const { count } = priceCart(getCart());
    badges.forEach((badge) => {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count === 0;
      badge.closest("a")?.setAttribute("aria-label", count ? `Cart, ${count} item${count === 1 ? "" : "s"}` : "Cart");
    });
  };
  update();
  onCartChange(update);
}

function initYear() {
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
}

function initOrderSuccess() {
  if (document.getElementById("order-success") && new URLSearchParams(location.search).has("session_id")) clearCart();
}
