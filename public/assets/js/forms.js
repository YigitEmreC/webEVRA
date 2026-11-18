// Contact and support forms. Any <form data-endpoint="/api/..."> is sent as
// JSON to that Cloudflare function, which e-mails it to you and sends the
// visitor an automatic confirmation.

import { settings } from "../../data/settings.js";
import { products, packages } from "../../data/catalog.js";
import { escapeHtml } from "./ui.js";

export function initForms() {
  const forms = document.querySelectorAll("form[data-endpoint]");
  if (!forms.length) return;

  fillProductSelects();
  if (settings.turnstileSiteKey) loadTurnstile();
  forms.forEach((form) => form.addEventListener("submit", (e) => submit(e, form)));
}

async function submit(event, form) {
  event.preventDefault();
  if (!form.reportValidity()) return;

  const status = form.querySelector("[data-status]");
  const button = form.querySelector('[type="submit"]');
  const label = button.textContent;
  status.hidden = true;
  button.disabled = true;
  button.textContent = "Sending…";

  try {
    const res = await fetch(form.dataset.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(new FormData(form))),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again, or e-mail us directly.");
    showSuccess(form, data);
  } catch (err) {
    status.textContent = err.message;
    status.hidden = false;
    window.turnstile?.reset(form.querySelector(".turnstile-slot"));
  } finally {
    button.disabled = false;
    button.textContent = label;
  }
}

function showSuccess(form, data) {
  const panel = document.querySelector(`[data-success-for="${form.id}"]`);
  if (!panel) return;
  panel.querySelectorAll("[data-ticket]").forEach((el) => (el.textContent = data.ticket || ""));
  form.reset();
  form.hidden = true;
  panel.hidden = false;
  panel.focus();
}

function fillProductSelects() {
  document.querySelectorAll("select[data-products]").forEach((select) => {
    const group = (label, list) =>
      `<optgroup label="${label}">${list.map((i) => `<option value="${escapeHtml(i.id)}">${escapeHtml(i.name)}</option>`).join("")}</optgroup>`;
    select.insertAdjacentHTML("beforeend", group("Packages", packages) + group("Products", products));
  });
}

function loadTurnstile() {
  const slots = document.querySelectorAll(".turnstile-slot");
  if (!slots.length) return;
  window.onTurnstileLoad = () => slots.forEach((slot) => window.turnstile.render(slot, { sitekey: settings.turnstileSiteKey }));
  const script = document.createElement("script");
  script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?onload=onTurnstileLoad&render=explicit";
  script.async = true;
  document.head.append(script);
}
