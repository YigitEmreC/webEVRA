// ─────────────────────────────────────────────────────────────────────────────
//  SHOP SETTINGS
//  Used by the website AND by the checkout on the server, so the price the
//  customer sees in the cart is always the price they pay.
// ─────────────────────────────────────────────────────────────────────────────

export const settings = {
  // Shown in e-mails sent by the website and in the checkout.
  companyName: "Evra",

  // Where the website's e-mails go. Change an address here and every form follows.
  // (Cloudflare variables CONTACT_TO / SALES_TO / SUPPORT_TO / MAIL_FROM override these.)
  email: {
    // Sender shown on the e-mails the website sends. Must be on the domain verified in Resend.
    from: "Evra <info@evrasmarthome.com>",
    info: "info@evrasmarthome.com",       // contact form: general questions
    sales: "satis@evrasmarthome.com",     // contact form: the topics listed below
    support: "destek@evrasmarthome.com",  // support portal (support page)
    // Contact form topics that go to the sales inbox instead of info@.
    // Must match the <option> texts in contact.html exactly.
    salesTopics: ["Danışmanlık veya fiyat teklifi", "Sipariş hakkında soru", "Kurumsal veya iş birliği"],
  },

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
