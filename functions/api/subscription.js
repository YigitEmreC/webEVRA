// Monthly subscription (Güvence / Premium), after a package request.
//   POST /api/subscription           → from /abonelik.html: opens the provider's card form
//   POST /api/subscription/callback  → the provider sends the customer back here
//   POST /api/subscription/webhook   → the provider reports renewals / failed payments
// The provider itself (iyzico …) lives in lib/billing.js; while BILLING_PROVIDER is
// not set in Cloudflare, starting returns "not connected" and the page says we'll call.
// Every result is e-mailed to the sales inbox (satis@), so nothing needs a database.

import { json, sameOrigin, readBody, line, isEmail } from "../../lib/http.js";
import { emailConfigured, inbox, sendEmail, fieldsEmail } from "../../lib/email.js";
import { isValidOrderRef, normalizeOrderRef } from "../../lib/order-ref.js";
import { billingProvider, canBillOnline, paidPlan, planCode, BillingError } from "../../lib/billing.js";
import { settings } from "../../public/data/settings.js";

/** Turkish ID number (T.C. kimlik no) check: 11 digits and its two check digits. */
function isTckn(v) {
  if (!/^[1-9]\d{10}$/.test(v)) return false;
  const d = [...v].map(Number);
  const odd = d[0] + d[2] + d[4] + d[6] + d[8];
  const even = d[1] + d[3] + d[5] + d[7];
  if ((((odd * 7 - even) % 10) + 10) % 10 !== d[9]) return false;
  return d.slice(0, 10).reduce((a, b) => a + b, 0) % 10 === d[10];
}

/** "0532 123 45 67" → "+905321234567" */
function gsm(v) {
  const digits = String(v).replace(/\D/g, "");
  if (digits.length === 10) return `+90${digits}`;
  if (digits.length === 11 && digits.startsWith("0")) return `+9${digits}`;
  if (digits.length === 12 && digits.startsWith("90")) return `+${digits}`;
  return "";
}

const planByCode = (code) => (settings.subscriptions || []).find((p) => code && planCode(p.id) === code) || null;

// ── Start: open the card form ───────────────────────────────────────────────
export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  let body;
  try {
    body = await readBody(request);
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }
  const planId = line(body.plan, 40);
  const plan = paidPlan(planId);
  const ticket = normalizeOrderRef(body.ref);
  if (!plan) return json({ error: "Lütfen ücretli bir plan seçin (Güvence veya Premium). Temel plan ücretsizdir." }, 400);
  if (!(await isValidOrderRef(env, ticket))) return json({ error: "Sipariş numaranız doğrulanamadı. Onay e-postanızdaki numarayı kontrol edin." }, 400);
  if (!canBillOnline(env, planId)) return json({ error: "Online ödeme henüz açık değil. Aboneliğinizi kurulum günü birlikte başlatacağız.", offline: true }, 503);

  const customer = {
    name: line(body.name, 60),
    surname: line(body.surname, 60),
    identityNumber: line(body.identityNumber, 11),
    email: line(body.email, 254),
    phone: gsm(body.phone),
    city: line(body.city, 60),
    address: line(body.address, 200),
  };
  if (!customer.name || !customer.surname || !isEmail(customer.email) || !customer.phone || !customer.city || !customer.address) {
    return json({ error: "Lütfen adınızı, soyadınızı, e-postanızı, cep telefonunuzu, şehrinizi ve fatura adresinizi girin." }, 400);
  }
  if (!isTckn(customer.identityNumber)) return json({ error: "T.C. kimlik numaranızı kontrol edin (11 hane). Ödeme kuruluşu fatura için istiyor." }, 400);

  const origin = new URL(request.url).origin;
  try {
    const result = await billingProvider(env).startCheckout(env, { planId, ticket, customer, callbackUrl: `${origin}/api/subscription/callback` });
    return json({ ok: true, ...result });
  } catch (err) {
    console.error("subscription: start failed", err);
    const msg = err instanceof BillingError ? err.message : "Ödeme sayfası açılamadı.";
    return json({ error: `${msg} Lütfen biraz sonra tekrar deneyin veya bizi arayın.` }, 502);
  }
}

// ── Callback: the customer comes back from the card form ────────────────────
export async function onCallback({ request, env }) {
  const provider = billingProvider(env);
  const back = (status, ref = "") => Response.redirect(`${new URL(request.url).origin}/abonelik.html?durum=${status}${ref ? `&ref=${encodeURIComponent(ref)}` : ""}`, 303);
  if (!provider) return back("hata");
  let form = {};
  try {
    form = await readBody(request);
  } catch {
    /* empty */
  }
  let result;
  try {
    result = await provider.finishCheckout(env, form);
  } catch (err) {
    console.error("subscription: callback failed", err);
    return back("hata");
  }
  const plan = planByCode(result.planCode);
  await notifySales(env, `${result.ok ? "Yeni abonelik" : "Abonelik başlatılamadı"}${result.ticket ? ` [${result.ticket}]` : ""}`, [
    ["Sonuç", result.ok ? "Kart kaydedildi, abonelik oluşturuldu" : `Başarısız: ${result.error || "bilinmiyor"}`],
    ["Sipariş numarası", result.ticket],
    ["Plan", plan ? `${plan.name} – ${plan.price} TL/ay` : result.planCode],
    ["Durum (ödeme kuruluşu)", result.status],
    ["Abonelik referansı", result.subscriptionRef],
    ["Müşteri referansı", result.customerRef],
    ["Ödeme kuruluşu", provider.name],
  ]);
  return back(result.ok ? "tamam" : "hata", result.ticket);
}

// ── Webhook: renewals, failed payments, cancellations ───────────────────────
export async function onWebhook({ request, env }) {
  const provider = billingProvider(env);
  if (!provider) return json({ error: "Billing off." }, 404);
  const event = await provider.readWebhook(env, request).catch(() => null);
  if (!event) return json({ error: "Invalid signature." }, 401);
  const failed = /fail/i.test(event.type);
  await notifySales(env, `${failed ? "⚠ Abonelik ödemesi alınamadı" : "Abonelik bildirimi"}: ${event.type}`, [
    ["Olay", event.type],
    ["Abonelik referansı", event.subscriptionRef],
    ["Müşteri referansı", event.customerRef],
    ["Ödeme referansı", event.orderRef],
    ["Ne yapmalı?", failed ? "Ödeme kuruluşu birkaç kez daha dener. Müşteriyi arayıp kartını güncellemesini isteyin." : "Bilgi amaçlı; işlem gerekmez."],
  ]);
  return json({ ok: true });
}

async function notifySales(env, subject, rows) {
  const to = inbox(env, "sales");
  if (!emailConfigured(env) || !to) return;
  try {
    await sendEmail(env, { to, subject, ...fieldsEmail(subject, rows) });
  } catch (err) {
    console.error("subscription: e-mail failed", err);
  }
}
