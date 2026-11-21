// Subscription comparison table: every element with [data-plan-table] (home page
// and Servisler → #abonelik). Plans and prices: settings.js → subscriptions;
// rows (✓ / ✗ / text): settings.js → subscriptionFeatures. A plan whose price is
// null shows "Fiyat yakında" until a price is written there.

import { settings } from "../../data/settings.js";
import { escapeHtml } from "./ui.js";

const money = new Intl.NumberFormat(settings.locale, { style: "currency", currency: settings.currency, maximumFractionDigits: 0 });
const YES = '<svg class="pt-yes" viewBox="0 0 24 24" role="img" aria-label="Var"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';
const NO = '<svg class="pt-no" viewBox="0 0 24 24" role="img" aria-label="Yok"><path d="M6 6l12 12M18 6 6 18"/></svg>';

function price(plan) {
  if (plan.price === 0) return `<span class="pt-price">Ücretsiz</span>`;
  if (typeof plan.price === "number") return `<span class="pt-price">${money.format(plan.price)}<small> /ay</small></span>`;
  return `<span class="pt-price is-tbd">Fiyat yakında</span>`;
}

function cell(value) {
  if (value === "gold") return YES.replace('class="pt-yes"', 'class="pt-yes pt-gold"');
  if (value === true) return YES;
  if (value === false || value == null) return NO;
  return `<span class="pt-text">${escapeHtml(value)}</span>`;
}

export function initPlans() {
  const plans = settings.subscriptions || [];
  const rows = settings.subscriptionFeatures || [];
  document.querySelectorAll("[data-plan-table]").forEach((root) => {
    const cta = root.dataset.planCta || "/contact.html";
    root.innerHTML = `
      <div class="pt-scroll">
        <table class="plan-table">
          <caption class="sr-only">Abonelik planlarının karşılaştırması</caption>
          <thead>
            <tr>
              <th scope="col" class="pt-corner"><span>Ne dahil?</span></th>
              ${plans
                .map(
                  (p) => `
                <th scope="col" class="${p.popular ? "is-popular" : ""}">
                  ${p.popular ? `<span class="pt-badge">En çok tercih edilen</span>` : ""}
                  <span class="pt-name">${escapeHtml(p.name)}</span>
                  ${price(p)}
                  <span class="pt-sub">${escapeHtml(p.text || "")}</span>
                </th>`
                )
                .join("")}
            </tr>
          </thead>
          <tbody>
            ${rows
              .map(
                (r) => `
              <tr${plans.some((p) => r[p.id] === "gold") ? ' class="pt-row-gold"' : ""}>
                <th scope="row">${escapeHtml(r.label)}</th>
                ${plans.map((p) => `<td class="${p.popular ? "is-popular" : ""}">${cell(r[p.id])}</td>`).join("")}
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
      <div class="pt-cta"><a class="btn btn-glow" href="${escapeHtml(cta)}">Bilgi al</a></div>`;
  });
}
