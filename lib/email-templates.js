// ─────────────────────────────────────────────────────────────────────────────
//  THE E-MAIL BOT'S WORDING
//  The automatic confirmations visitors receive after using the contact form
//  or the support portal. Edit the text freely; keep the ${...} parts.
// ─────────────────────────────────────────────────────────────────────────────

import { settings } from "../public/data/settings.js";

const company = settings.companyName;

export function contactAutoReply({ name, message }) {
  return {
    subject: `Mesajınızı aldık – ${company}`,
    text: `Merhaba ${name},

${company} ile iletişime geçtiğiniz için teşekkür ederiz. Bu e-posta, mesajınızın bize ulaştığını bildiren otomatik bir onaydır.

Ortalama 5 iş günü içinde yanıt veriyoruz. Acil bir durumda bizi +90 533 469 51 79 numarasından arayabilirsiniz.

Mesajınız:
${message}

Saygılarımızla,
${company} ekibi`,
  };
}

export function supportAutoReply({ name, ticket, type, urgency, message }) {
  return {
    subject: `[${ticket}] Destek talebinizi aldık – ${company}`,
    text: `Merhaba ${name},

Talebiniz için teşekkür ederiz. Talebiniz ${ticket} referans numarasıyla kaydedildi. Bu konuda bize ulaşırken lütfen bu numarayı belirtin.

Talep: ${type}
Aciliyet: ${urgency}

Teknik ekibimiz ortalama 7 iş günü içinde sizinle iletişime geçerek sorunu uzaktan inceleyecek veya bir ziyaret planlayacaktır.

Açıklamanız:
${message}

Saygılarımızla,
${company} destek ekibi`,
  };
}
