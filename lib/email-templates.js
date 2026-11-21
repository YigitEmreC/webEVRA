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

Ortalama 2 iş günü içinde yanıt veriyoruz. Acil bir durumda bizi +90 533 469 51 79 numarasından arayabilirsiniz.

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

export function orderAutoReply({ name, ticket, packageLine, extrasText, totalLine, wishes, depositLine, depositSender, planLine = "", custom = false }) {
  return {
    subject: `[${ticket}] Paket talebinizi aldık – ${company}`,
    text: `Merhaba ${name},

Paket talebiniz için teşekkür ederiz. Sipariş numaranız: ${ticket}
Bu numarayı saklayın; destek talebi gönderirken gerekecek.

Seçtiğiniz paket: ${packageLine}
${custom ? "Paketinizdeki ürünler" : "Ekstra ürünler"}:
${extrasText}
Toplam: ${totalLine}
Kapora (%20, havale/EFT): ${depositLine} · Gönderen: ${depositSender}
${planLine ? `Abonelik planı: ${planLine}\n` : ""}${wishes ? `\nİstekleriniz:\n${wishes}\n` : ""}
Sırada ne var?
1. Kaporanızın hesabımıza ulaştığını kontrol edip ortalama 2 iş günü içinde sizi arıyoruz. ${custom ? "Evinizi ve paketinizi birlikte gözden geçiriyoruz." : "Evinizi, paketinizi ve ekstra ürünleri konuşup ekstra ürünlerin fiyatını birlikte netleştiriyoruz."}
2. Size uygun gün ve saati belirleyip kurulum randevunuzu oluşturuyoruz.
3. Kurulum günü teknisyenimiz gelir, sisteminizi kurar ve kullanımını anlatır.

${custom ? "Kalan tutarın ödemesi" : "Kalan tutar ve ekstra ürünlerin fiyatı"} bu görüşmede netleşir. Sorunuz olursa bizi +90 533 469 51 79 numarasından arayabilirsiniz.

Saygılarımızla,
${company} ekibi`,
  };
}

export function planningAutoReply({ name, size, city }) {
  return {
    subject: `Planlama talebinizi aldık – ${company}`,
    text: `Merhaba ${name},

${size} eviniz (${city}) için planlama talebiniz bize ulaştı, teşekkür ederiz.

Sırada ne var?
1. Ortalama 2 iş günü içinde sizi arıyoruz ve evinizi, isteklerinizi konuşuyoruz.
2. Gerekirse evinize keşif için geliyoruz.
3. Evinize özel planı ve teklifi size iletiyoruz.

Sorunuz olursa bizi +90 533 469 51 79 numarasından arayabilirsiniz.

Saygılarımızla,
${company} ekibi`,
  };
}
