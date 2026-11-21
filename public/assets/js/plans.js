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
    // data-plan-select="plan": the table is a required choice in a form (Siparişim);
    // each column header holds a radio button with that name, and there's no CTA.
    const select = root.dataset.planSelect || "";
    const head = (p) => `
                  ${p.popular ? `<span class="pt-badge"><span class="pt-long">En çok tercih edilen</span><span class="pt-short">Popüler</span></span>` : ""}
                  <span class="pt-name">${escapeHtml(p.name)}</span>
                  ${price(p)}
                  <span class="pt-sub">${escapeHtml(p.text || "")}</span>`;
    root.innerHTML = `
      <div class="pt-scroll">
        <table class="plan-table${select ? " is-select" : ""}">
          <caption class="sr-only">Abonelik planlarının karşılaştırması</caption>
          <thead>
            <tr>
              <th scope="col" class="pt-corner"><span>Ne dahil?</span></th>
              ${plans
                .map(
                  (p, i) => `
                <th scope="col" class="${p.popular ? "is-popular" : ""} pt-col-${escapeHtml(p.id)}">
                  ${
                    select
                      ? `<label class="pt-pick">
                    <input type="radio" name="${escapeHtml(select)}" value="${escapeHtml(p.id)}" ${i === 0 ? "required" : ""}>
                    ${head(p)}
                    <span class="pt-pick-btn" aria-hidden="true"><span class="pt-pick-off">Seç</span><span class="pt-pick-on">✓ Seçildi</span></span>
                  </label>`
                      : head(p)
                  }
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
                ${plans.map((p) => `<td class="${p.popular ? "is-popular" : ""} pt-col-${escapeHtml(p.id)}">${cell(r[p.id])}</td>`).join("")}
              </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>
      ${select ? "" : `<div class="pt-cta"><a class="btn btn-glow" href="${escapeHtml(cta)}">Bilgi al</a></div>`}`;
    if (select) {
      // Marks the chosen column (CSS: [data-chosen]) and lets clicks on its cells choose too.
      const table = root.querySelector(".plan-table");
      const mark = () => (table.dataset.chosen = root.querySelector(`input[name="${select}"]:checked`)?.value || "");
      root.addEventListener("change", mark);
      root.addEventListener("click", (e) => {
        const cellEl = e.target.closest("td[class*='pt-col-']");
        if (!cellEl) return;
        const id = [...cellEl.classList].find((c) => c.startsWith("pt-col-"))?.slice(7);
        const input = root.querySelector(`input[name="${select}"][value="${id}"]`);
        if (input && !input.checked) {
          input.checked = true;
          input.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
      mark();
    }
  });
}
