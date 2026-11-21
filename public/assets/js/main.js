// Entry point, loaded by every page. Each feature only switches on when its
// element is on the page, so one script tag works everywhere.

import { orderCount, onOrderChange } from "./cart-store.js";
import { ensureToast } from "./ui.js";
import { initProducts } from "./products.js";
import { initPackages } from "./packages.js";
import { initBuilder } from "./builder.js";
import { initShowcase } from "./showcase.js";
import { initPlans } from "./plans.js";
import { initCartPage } from "./cart-page.js";
import { initForms } from "./forms.js";
import { initFaq } from "./faq.js";
import { initSubscribe } from "./subscribe.js";

const features = [initNightSky, initTheme, initNav, initActiveLink, initCartBadge, initYear, ensureToast, initProducts, initPackages, initBuilder, initShowcase, initPlans, initCartPage, initForms, initFaq, initOrderSuccess, initSubscribe];

for (const init of features) {
  try {
    init();
  } catch (err) {
    console.error(`[site] ${init.name} failed:`, err);
  }
}

// Dark mode switch in the header. The saved choice is applied before the page
// draws by a one-line script in each page's <head>, so there is no flash.
/**
 * Night background behind every page (shown in night mode, the default):
 * slow northern lights at the top and thin lines of light that run across the
 * page and fade out. Pure CSS animation, fixed behind the content.
 */
function initNightSky() {
  if (document.querySelector(".night-sky")) return;
  const lines = [
    "M-60 140C260 40 520 300 860 180S1360 20 1520 120",
    "M-80 320C300 200 640 470 980 320S1400 220 1540 300",
    "M-60 520C240 400 600 660 940 500S1380 400 1520 480",
    "M-60 700C320 600 660 840 1000 680S1400 600 1520 660",
    "M-80 860C300 760 600 980 960 840S1380 760 1540 820",
    "M1500 60C1180 200 900 40 600 180S120 260 -60 160",
    "M1500 420C1200 560 940 380 620 520S160 600 -60 500",
    "M1500 780C1160 900 880 720 560 860S140 940 -60 860",
  ];
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<div class="night-sky" aria-hidden="true">
      <div class="aurora"><span></span><span></span><span></span></div>
      <svg class="night-lines" viewBox="0 0 1440 1000" preserveAspectRatio="none">${lines.map((d) => `<path d="${d}"/>`).join("")}</svg>
      <div class="night-stars"></div>
    </div>`
  );
}

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
