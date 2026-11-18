// ─────────────────────────────────────────────────────────────────────────────
//  SHOP SETTINGS
//  Used by the website AND by the checkout on the server, so the price the
//  customer sees in the cart is always the price they pay.
// ─────────────────────────────────────────────────────────────────────────────

export const settings = {
  // Shown in e-mails sent by the website and in the checkout.
  companyName: "[Company]",

  // ISO currency code and number format:
  // "en-IE" shows €1,149.50 (English style), "nl-NL" shows € 1.149,50 (Dutch style).
  currency: "TRY",
  locale: "tr-TR",

  shipping: {
    // Countries you deliver to (two-letter codes). Stripe only accepts
    // delivery addresses in these countries.
    countries: ["TR"],
    // Flat delivery fee in euros. Set to 0 for free delivery.
    fee: 0,
    // Orders at or above this amount ship free. Set to null to switch off.
    freeFrom: null,
    // Name of the delivery option shown at checkout.
    label: "Standard delivery",
  },

  // Optional spam protection for the contact and support forms.
  // Paste your Cloudflare Turnstile *site key* here (see README → Spam protection).
  turnstileSiteKey: "",
};
