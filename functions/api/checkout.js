// POST /api/checkout — starts a Stripe Checkout session for the cart.
//
// The browser only sends ids and quantities. Prices come from
// public/data/catalog.js on the server, so nobody can change what they pay.
// The customer enters their card / iDEAL details on Stripe's secure page,
// which keeps card numbers off this website entirely (PCI DSS).
//
// Needs the STRIPE_SECRET_KEY environment variable (see README → Payments).

import { json, sameOrigin } from "../../lib/http.js";
import { priceCart } from "../../public/assets/js/pricing.js";
import { settings } from "../../public/data/settings.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);
  if (!env.STRIPE_SECRET_KEY) {
    return json({ error: "Online payment isn't set up yet. Please contact us to place your order." }, 503);
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const cart = priceCart(body?.items);
  if (!cart.lines.length) return json({ error: "Your cart is empty." }, 400);

  const origin = new URL(request.url).origin;
  const currency = settings.currency.toLowerCase();
  const params = new URLSearchParams();
  const add = (key, value) => params.append(key, String(value));

  add("mode", "payment");
  add("success_url", `${origin}/order-success.html?session_id={CHECKOUT_SESSION_ID}`);
  add("cancel_url", `${origin}/cart.html`);
  add("billing_address_collection", "auto");
  add("phone_number_collection[enabled]", "true");
  add("metadata[source]", "website");
  settings.shipping.countries.forEach((country, i) => add(`shipping_address_collection[allowed_countries][${i}]`, country));

  cart.lines.forEach(({ item, quantity, unitCents }, i) => {
    const key = `line_items[${i}]`;
    add(`${key}[quantity]`, quantity);
    add(`${key}[price_data][currency]`, currency);
    add(`${key}[price_data][unit_amount]`, unitCents);
    add(`${key}[price_data][product_data][name]`, item.kind === "package" ? `${item.name} package` : item.name);
    add(`${key}[price_data][product_data][metadata][catalog_id]`, item.id);
    if (item.image?.startsWith("/")) add(`${key}[price_data][product_data][images][0]`, origin + item.image);
  });

  add("shipping_options[0][shipping_rate_data][type]", "fixed_amount");
  add("shipping_options[0][shipping_rate_data][display_name]", settings.shipping.label);
  add("shipping_options[0][shipping_rate_data][fixed_amount][amount]", cart.shippingCents);
  add("shipping_options[0][shipping_rate_data][fixed_amount][currency]", currency);

  const res = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params,
  });
  const session = await res.json().catch(() => ({}));

  if (!res.ok || !session.url) {
    console.error("checkout: Stripe error", res.status, JSON.stringify(session.error || session));
    return json({ error: "We couldn't start the payment. Please try again in a moment." }, 502);
  }
  return json({ url: session.url });
}
