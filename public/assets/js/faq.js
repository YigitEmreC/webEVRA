// FAQ: search box and category chips. The questions themselves are plain HTML
// in support.html, so they work (and are indexed by search engines) without JS.

import { escapeHtml } from "./ui.js";

export function initFaq() {
  const root = document.getElementById("faq");
  if (!root) return;

  const input = root.querySelector("#faq-search");
  const chips = root.querySelector("[data-faq-chips]");
  const groups = [...root.querySelectorAll(".faq-group")];
  const empty = root.querySelector("#faq-empty");
  let active = "all";

  chips.innerHTML = [["all", "Tümü"], ...groups.map((g) => [g.id, g.querySelector("h3").textContent])]
    .map(([id, label]) => `<button type="button" class="chip" data-topic="${escapeHtml(id)}" aria-pressed="${id === active}">${escapeHtml(label)}</button>`)
    .join("");

  function apply() {
    const q = input.value.trim().toLowerCase();
    let total = 0;
    for (const group of groups) {
      let visible = 0;
      for (const item of group.querySelectorAll(".faq-item")) {
        const match = (active === "all" || group.id === active) && (!q || item.textContent.toLowerCase().includes(q));
        item.hidden = !match;
        if (match) visible++;
      }
      group.hidden = visible === 0;
      total += visible;
    }
    empty.hidden = total > 0;
  }

  chips.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-topic]");
    if (!chip) return;
    active = chip.dataset.topic;
    chips.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
    apply();
  });
  input.addEventListener("input", apply);

  // Opened from a link like /support.html#faq-offline
  const target = location.hash && document.getElementById(location.hash.slice(1));
  if (target?.matches("details")) target.open = true;
}
