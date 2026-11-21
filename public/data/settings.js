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

  // Price of a package built with "Kendi paketini oluştur", calculated in this order:
  //   1. products (catalog prices, KDV removed) + productMarkup
  //   2. + electrician (electrician and service) + travel
  //   3. + warranty (on the result of step 2)
  //   4. + margin (our profit)
  //   5. + vat (KDV)
  // The result is rounded to whole lira. The breakdown is only in the sales e-mail.
  pricing: {
    catalogPricesIncludeVat: true, // catalog.js prices are KDV dahil
    productMarkup: 0.1,  // %10
    electrician: 2000,   // TL, elektrikçi ve servis hizmeti
    travel: 500,         // TL, ulaşım
    warranty: 0.05,      // %5
    margin: 0.3,         // %30
    vat: 0.2,            // %20 KDV
  },

  // Monthly service plans shown on the Servisler page (#abonelik).
  // price: monthly price in TL, 0 = free, null = not decided yet ("Fiyat yakında").
  // popular: true shows the "En çok tercih edilen" badge.
  subscriptions: [
    {
      id: "temel",
      name: "Temel",
      price: 0,
      text: "Kurulumla birlikte gelir.",
      features: ["Uygulama ve duvar ekranı", "Gece otomatik güncellemeler", "E-posta ile destek"],
    },
    {
      id: "guvence",
      name: "Güvence",
      price: 340, // TL / ay
      popular: true,
      text: "Çoğu ev için doğru seçim.",
      features: ["Temel'deki her şey", "Hızlı servis: uzaktan, aynı gün", "Yılda 1 bakım ziyareti + pil değişimi", "Sistem yedekleme"],
    },
    {
      id: "premium",
      name: "Premium",
      price: 600, // TL / ay
      text: "Kameralı ve büyük evler için.",
      features: ["Güvence'deki her şey", "Ekstra ürünlerde %10 indirim", "Taşınırken söküp takma ücretsiz", "Öncelikli WhatsApp desteği", "Kamera kayıtlarının yedeği", "Öncelikli ziyaret (48 saat)", "Yılda 2 bakım ziyareti"],
    },
  ],

  // Comparison table (home page + Servisler → #abonelik). One row per perk;
  // per plan: true = ✓, false = ✗, "gold" = gold ✓ (highlighted perk), or a
  // short text such as "Yılda 2".
  subscriptionFeatures: [
    { label: "Uygulama ve duvar ekranı", temel: true, guvence: true, premium: true },
    { label: "Gece otomatik güncellemeler", temel: true, guvence: true, premium: true },
    { label: "İnternet kesilse de çalışan sistem", temel: true, guvence: true, premium: true },
    { label: "E-posta ile destek", temel: true, guvence: true, premium: true },
    { label: "Hızlı servis: uzaktan, aynı gün", temel: false, guvence: true, premium: true },
    { label: "Sistem yedekleme", temel: false, guvence: true, premium: true },
    { label: "Bakım ziyareti ve pil değişimi", temel: false, guvence: "Yılda 1", premium: "Yılda 2" },
    { label: "Kamera kayıtlarının yedeği", temel: false, guvence: false, premium: true },
    { label: "Öncelikli ziyaret (48 saat)", temel: false, guvence: false, premium: true },
    { label: "Ekstra ürünlerde %10 indirim", temel: false, guvence: false, premium: "gold" },
    { label: "Taşınırken söküp takma ücretsiz", temel: false, guvence: false, premium: "gold" },
    { label: "Öncelikli WhatsApp desteği", temel: false, guvence: false, premium: "gold" },
  ],

  // Optional spam protection for the contact and support forms.
  // Paste your Cloudflare Turnstile *site key* here (see README → Spam protection).
  turnstileSiteKey: "0x4AAAAAAGJE1nJAyKWWO1ZE",
};
