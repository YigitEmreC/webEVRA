// Monthly subscription, after a package request.
//  • Thank-you page (/order-success.html?ref=…&plan=…[&odeme=1]): shows the chosen
//    plan; with odeme=1 (online billing on, see lib/billing.js) a button to save a card.
//  • /abonelik.html?ref=…&plan=…: the billing details form → /api/subscription →
//    the payment provider's own card form appears on the page. After paying, the
//    provider sends the customer back to /abonelik.html?durum=tamam (or hata).

import { settings } from "../../data/settings.js";
import { formatMoney, toCents } from "./pricing.js";
import { escapeHtml } from "./ui.js";

const planOf = (id) => (settings.subscriptions || []).find((p) => p.id === id) || null;
const priceText = (p) => (p.price ? `${formatMoney(toCents(p.price))} /ay` : "Ücretsiz");
const REF = /^PT-\d{6}-[A-Z0-9]{4}-[A-Z0-9]{5}$/;

export function initSubscribe() {
  successBlock();
  subscribePage();
}

function successBlock() {
  const box = document.querySelector("[data-success-plan]");
  if (!box) return;
  const q = new URLSearchParams(location.search);
  const plan = planOf(q.get("plan"));
  const ref = q.get("ref") || "";
  if (!plan) return;
  const online = q.get("odeme") === "1" && plan.price > 0 && REF.test(ref);
  box.innerHTML = `
    <h2>Abonelik planınız: ${escapeHtml(plan.name)} · ${escapeHtml(priceText(plan))}</h2>
    ${
      !plan.price
        ? `<p class="muted">Temel plan ücretsizdir; kurulumla birlikte başlar. İstediğiniz zaman Güvence veya Premium'a geçebilirsiniz.</p>`
        : online
          ? `<p class="muted">Kartınızı şimdi güvenle kaydedebilirsiniz; ilk ödeme kurulumdan sonra alınır. İsterseniz bunu kurulum günü de yapabiliriz.</p>
             <a class="btn btn-primary" href="/abonelik.html?ref=${encodeURIComponent(ref)}&plan=${encodeURIComponent(plan.id)}">Kartımı kaydet</a>`
          : `<p class="muted">Aylık ödemeniz kurulumdan sonra başlar. Ödeme yöntemini sizi aradığımızda birlikte belirleyeceğiz.</p>`
    }`;
  box.hidden = false;
}

function subscribePage() {
  const root = document.getElementById("subscribe");
  if (!root) return;
  const q = new URLSearchParams(location.search);
  const status = q.get("durum");

  if (status) {
    const ok = status === "tamam";
    root.innerHTML = `
      <div class="card card-pad sub-result">
        <h1>${ok ? "Aboneliğiniz hazır!" : "Ödeme tamamlanamadı"}</h1>
        <p class="lead">${
          ok
            ? "Kartınız kaydedildi. İlk ödeme kurulumdan sonra alınır; her ay aynı gün yenilenir. Onay e-postası ödeme kuruluşundan gelecek."
            : "Kartınız kaydedilemedi veya işlem yarıda kaldı; hiçbir ücret alınmadı. Bizi arayın, aboneliğinizi birlikte başlatalım ya da kurulum günü hallederiz."
        }</p>
        <div class="actions actions-center">
          <a class="btn btn-primary" href="/">Ana sayfaya dön</a>
          <a class="btn btn-secondary" href="/contact.html">Bize ulaşın</a>
        </div>
      </div>`;
    return;
  }

  const plan = planOf(q.get("plan"));
  const ref = (q.get("ref") || "").toUpperCase();
  const form = root.querySelector("form");
  if (!plan || !plan.price || !REF.test(ref) || !form) {
    root.innerHTML = `
      <div class="card card-pad sub-result">
        <h1>Bağlantı eksik</h1>
        <p class="lead">Bu sayfayı sipariş sonrası teşekkür sayfasındaki "Kartımı kaydet" butonuyla açın.</p>
        <div class="actions actions-center"><a class="btn btn-primary" href="/contact.html">Bize ulaşın</a></div>
      </div>`;
    return;
  }

  root.querySelector("[data-sub-plan]").innerHTML = `<strong>${escapeHtml(plan.name)}</strong><span>${escapeHtml(priceText(plan))}</span>`;
  root.querySelector("[data-sub-ref]").textContent = ref;
  form.elements.plan.value = plan.id;
  form.elements.ref.value = ref;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const msg = form.querySelector("[data-status]");
    const button = form.querySelector('[type="submit"]');
    msg.hidden = true;
    button.disabled = true;
    button.textContent = "Ödeme formu açılıyor…";
    try {
      const res = await fetch("/api/subscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Bir sorun oluştu. Lütfen tekrar deneyin.");
      if (data.url) {
        location.assign(data.url);
        return;
      }
      // The provider's own card form (iyzico: a script that draws into #iyzipay-checkout-form).
      const slot = root.querySelector("[data-checkout]");
      slot.innerHTML = `<div id="iyzipay-checkout-form" class="responsive"></div>`;
      const tmp = document.createElement("div");
      tmp.innerHTML = data.formHtml || "";
      for (const old of tmp.querySelectorAll("script")) {
        const s = document.createElement("script");
        for (const a of old.attributes) s.setAttribute(a.name, a.value);
        s.textContent = old.textContent;
        slot.appendChild(s);
      }
      form.hidden = true;
      slot.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (err) {
      msg.textContent = err.message;
      msg.hidden = false;
      button.disabled = false;
      button.textContent = "Ödeme formuna geç";
    }
  });
}
