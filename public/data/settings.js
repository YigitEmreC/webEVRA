// ─────────────────────────────────────────────────────────────────────────────
//  SHOP SETTINGS
//  Used by the website AND by the checkout on the server, so the price the
//  customer sees in the cart is always the price they pay.
// ─────────────────────────────────────────────────────────────────────────────

export const settings = {
  // Shown in e-mails sent by the website.
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

  // Deposit (kapora) for package requests, paid by bank transfer (havale/EFT)
  // before the request form can be sent. Shown on the Siparişim page.
  payment: {
    depositRate: 0.2, // 20% of the package price
    bankName: "[Banka adı]",
    accountName: "[Hesap sahibi / şirket ünvanı]",
    iban: "[TR00 0000 0000 0000 0000 0000 00]",
  },

  // Optional spam protection for the contact and support forms.
  // Paste your Cloudflare Turnstile *site key* here (see README → Spam protection).
  turnstileSiteKey: "0x4AAAAAAGJE1nJAyKWWO1ZE",
};
