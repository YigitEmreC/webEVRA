// Entry point for Cloudflare Workers (the project deploys with `npx wrangler deploy`).
// The website itself (public/) is served as static assets, see wrangler.jsonc.
// Only requests to /api/* reach this script; it hands them to the same handlers
// in functions/api/ that a Cloudflare Pages project would use.

import * as contact from "./functions/api/contact.js";
import * as support from "./functions/api/support.js";
import * as order from "./functions/api/order.js";
import * as planning from "./functions/api/planning.js";
import * as subscription from "./functions/api/subscription.js";

const routes = {
  "/api/contact": contact,
  "/api/support": support,
  "/api/order": order,
  "/api/planning": planning,
  // Monthly plans (lib/billing.js; off until BILLING_PROVIDER is set)
  "/api/subscription": { onRequestPost: subscription.onRequestPost },
  "/api/subscription/callback": { onRequestPost: subscription.onCallback },
  "/api/subscription/webhook": { onRequestPost: subscription.onWebhook },
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const route = routes[url.pathname.replace(/\/+$/, "")];
    if (!route) return env.ASSETS.fetch(request);

    const method = request.method.toUpperCase();
    const handler = route[`onRequest${method.charAt(0)}${method.slice(1).toLowerCase()}`] || route.onRequest;
    if (!handler) {
      return new Response(JSON.stringify({ error: "Method not allowed." }), {
        status: 405,
        headers: { Allow: "POST", "Content-Type": "application/json" },
      });
    }

    try {
      return await handler({ request, env, ctx, params: {}, waitUntil: (p) => ctx.waitUntil(p) });
    } catch (err) {
      console.error(`[worker] ${url.pathname} failed:`, err);
      return new Response(JSON.stringify({ error: "Bir sorun oluştu. Lütfen tekrar deneyin veya bize doğrudan e-posta gönderin." }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }
  },
};
