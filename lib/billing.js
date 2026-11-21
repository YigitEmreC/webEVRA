// ─────────────────────────────────────────────────────────────────────────────
//  MONTHLY SUBSCRIPTIONS (Güvence / Premium) — payment provider layer
//
//  The site talks to one "provider" through three functions:
//    startCheckout()   → the customer saves a card for the chosen plan
//    finishCheckout()  → the provider sends the customer back; we read the result
//    readWebhook()     → the provider tells us about renewals, failed payments …
//  Which provider is used is set in Cloudflare → Variables and Secrets:
//    BILLING_PROVIDER = "iyzico"   (empty / missing = off)
//  How to connect it, step by step, and the alternatives: ABONELIK.md.
//
//  Off (default): checkout still asks for a plan; it arrives in the order e-mail
//  and the subscription page says we will call. Nothing is charged.
//
//  ⚠ The iyzico adapter follows iyzico's subscription API documentation but has
//  not been run against a live account yet: test it in the sandbox first
//  (IYZICO_BASE_URL = https://sandbox-api.iyzipay.com) before going live.
// ─────────────────────────────────────────────────────────────────────────────

import { settings } from "../public/data/settings.js";

/** The paid plan with this id, or null (Temel is free: nothing to bill). */
export function paidPlan(id) {
  const plan = (settings.subscriptions || []).find((p) => p.id === id);
  return plan && typeof plan.price === "number" && plan.price > 0 ? plan : null;
}

/** The provider set up in Cloudflare, or null when billing is off. */
export function billingProvider(env) {
  const name = String(env.BILLING_PROVIDER || "").trim().toLowerCase();
  const provider = PROVIDERS[name];
  return provider && provider.configured(env) ? provider : null;
}

/** True when a customer can start paying for this plan online. */
export function canBillOnline(env, planId) {
  const plan = paidPlan(planId);
  return Boolean(plan && billingProvider(env) && planCode(planId));
}

/** The provider's code for a plan (settings.js → billing.planCodes). */
export function planCode(planId) {
  return String(settings.billing?.planCodes?.[planId] || "").trim();
}

// ── iyzico ──────────────────────────────────────────────────────────────────
// Docs: https://docs.iyzico.com → Abonelik (Subscription).
// Needs (Cloudflare → Variables and Secrets, as Secrets):
//   IYZICO_API_KEY, IYZICO_SECRET_KEY, IYZICO_MERCHANT_ID
// Optional: IYZICO_BASE_URL (default: sandbox — change to https://api.iyzipay.com to go live)

const iyzico = {
  name: "iyzico",

  configured(env) {
    return Boolean(env.IYZICO_API_KEY && env.IYZICO_SECRET_KEY);
  },

  /**
   * Starts iyzico's subscription checkout form. Returns { formHtml } (iyzico's
   * own card form, shown on /abonelik.html) or { url } when iyzico gives a page.
   */
  async startCheckout(env, { planId, ticket, customer, callbackUrl }) {
    const body = {
      locale: "tr",
      conversationId: ticket,
      callbackUrl,
      pricingPlanReferenceCode: planCode(planId),
      subscriptionInitialStatus: "ACTIVE", // the trial set on the plan in iyzico delays the first charge
      customer: {
        name: customer.name,
        surname: customer.surname,
        identityNumber: customer.identityNumber,
        email: customer.email,
        gsmNumber: customer.phone,
        billingAddress: { contactName: `${customer.name} ${customer.surname}`, city: customer.city, country: "Turkey", address: customer.address },
        shippingAddress: { contactName: `${customer.name} ${customer.surname}`, city: customer.city, country: "Turkey", address: customer.address },
      },
    };
    const data = await iyzicoRequest(env, "POST", "/v2/subscription/checkoutform/initialize", body);
    if (data.status !== "success") throw new BillingError(data.errorMessage || "Ödeme formu açılamadı.");
    if (data.paymentPageUrl) return { url: data.paymentPageUrl };
    return { formHtml: data.checkoutFormContent || "" };
  },

  /** iyzico posts { token } to our callback; the token tells us how it went. */
  async finishCheckout(env, form) {
    const token = String(form.token || "").slice(0, 200);
    if (!token) return { ok: false };
    const res = await iyzicoRequest(env, "GET", `/v2/subscription/checkoutform/${encodeURIComponent(token)}`);
    const d = res.data || {};
    return {
      ok: res.status === "success" && Boolean(d.referenceCode),
      subscriptionRef: d.referenceCode || "",
      customerRef: d.customerReferenceCode || "",
      planCode: d.pricingPlanReferenceCode || "",
      status: d.subscriptionStatus || "",
      ticket: res.conversationId || "",
      error: res.errorMessage || "",
    };
  },

  /**
   * Webhook (iyzico panel → Ayarlar → Bildirimler → "Abonelik bildirimleri" URL:
   * https://<site>/api/subscription/webhook). Returns null if the signature is wrong.
   */
  async readWebhook(env, request) {
    const raw = await request.text();
    let e;
    try {
      e = JSON.parse(raw);
    } catch {
      return null;
    }
    const given = request.headers.get("x-iyz-signature-v3") || "";
    const expected = await hmacHex(
      env.IYZICO_SECRET_KEY,
      `${env.IYZICO_MERCHANT_ID || ""}${env.IYZICO_SECRET_KEY}${e.iyziEventType || ""}${e.subscriptionReferenceCode || ""}${e.orderReferenceCode || ""}${e.customerReferenceCode || ""}`
    );
    if (!given || !timingSafeEqual(given.toLowerCase(), expected)) return null;
    return {
      type: String(e.iyziEventType || ""), // e.g. subscription.order.success / subscription.order.failure
      subscriptionRef: String(e.subscriptionReferenceCode || ""),
      customerRef: String(e.customerReferenceCode || ""),
      orderRef: String(e.orderReferenceCode || ""),
    };
  },
};

/** Signed request to iyzico (authorization "IYZWSv2"). */
async function iyzicoRequest(env, method, path, body) {
  const base = String(env.IYZICO_BASE_URL || "https://sandbox-api.iyzipay.com").replace(/\/+$/, "");
  const json = body ? JSON.stringify(body) : "";
  const randomKey = `${Date.now()}${Math.random().toString(36).slice(2, 10)}`;
  const signature = await hmacHex(env.IYZICO_SECRET_KEY, randomKey + path.split("?")[0] + json);
  const auth = btoa(`apiKey:${env.IYZICO_API_KEY}&randomKey:${randomKey}&signature:${signature}`);
  const res = await fetch(base + path, {
    method,
    headers: { Authorization: `IYZWSv2 ${auth}`, "x-iyzi-rnd": randomKey, "Content-Type": "application/json", Accept: "application/json" },
    body: body ? json : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok && data.status !== "failure") throw new BillingError(`iyzico HTTP ${res.status}`);
  return data;
}

// ── Shared helpers ──────────────────────────────────────────────────────────

export class BillingError extends Error {}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(String(secret || "")), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
  return [...mac].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// To add another provider (PayTR, Param, Stripe …): write an object with the same
// five members (name, configured, startCheckout, finishCheckout, readWebhook)
// and list it here under the value you put in BILLING_PROVIDER.
const PROVIDERS = { iyzico };
