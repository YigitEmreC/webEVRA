// Entry point, loaded by every page. Each feature only switches on when its
// element is on the page, so one script tag works everywhere.

import { orderCount, onOrderChange } from "./cart-store.js";
import { ensureToast } from "./ui.js";
import { initProducts } from "./products.js";
import { initPackages } from "./packages.js";
import { initBuilder } from "./builder.js";
import { initCartPage } from "./cart-page.js";
import { initForms } from "./forms.js";
import { initFaq } from "./faq.js";

const features = [initTheme, initNav, initActiveLink, initCartBadge, initYear, ensureToast, initProducts, initPackages, initBuilder, initCartPage, initForms, initFaq, initOrderSuccess];

for (const init of features) {
  try {
    init();
  } catch (err) {
    console.error(`[site] ${init.name} failed:`, err);
  }
}

// Dark mode switch in the header. The saved choice is applied before the page
// draws by a one-line script in each page's <head>, so there is no flash.
function initTheme() {
  const root = document.documentElement;
  const sync = () => {
    const dark = root.dataset.theme === "dark";
    document.querySelectorAll(".theme-toggle").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(dark));
      const label = dark ? "Aydınlık mod" : "Karanlık mod";
      btn.setAttribute("aria-label", label);
      btn.title = label;
    });
  };
  document.querySelectorAll(".theme-toggle").forEach((btn) =>
    btn.addEventListener("click", () => {
      const dark = root.dataset.theme !== "dark";
      if (dark) root.dataset.theme = "dark";
      else delete root.dataset.theme;
      try {
        localStorage.setItem("theme", dark ? "dark" : "light");
      } catch {}
      sync();
    })
  );
  sync();
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
    const count = orderCount();
    badges.forEach((badge) => {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.hidden = count === 0;
      badge.closest("a")?.setAttribute("aria-label", count ? `Siparişim, ${count} öğe` : "Siparişim");
    });
  };
  update();
  onOrderChange(update);
}

function initYear() {
  document.querySelectorAll("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
}

// Thank-you page after a package request: shows the reference number (?ref=PT-…).
function initOrderSuccess() {
  if (!document.getElementById("order-success")) return;
  const ref = new URLSearchParams(location.search).get("ref");
  document.querySelectorAll("[data-ref]").forEach((el) => {
    if (ref && /^[A-Z0-9-]{4,30}$/.test(ref)) el.textContent = ref;
    else el.closest("[data-ref-row]")?.setAttribute("hidden", "");
  });
}
