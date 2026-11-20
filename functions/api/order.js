// POST /api/order — a package request from the "Siparişim" page (/cart.html).
// The customer first pays a 20% deposit (kapora) by bank transfer and confirms it
// in the form (who sent it). It can't be checked automatically: the sales team
// checks the bank account. This:
// 1. Creates a signed order number like PT-261119-7KQ2-H8M4Q (lib/order-ref.js).
//    The support form only accepts these numbers.
// 2. E-mails the request (package, extra products, contact details) to the sales
//    inbox: satis@ (settings.js → email.sales). Pressing Reply goes to the customer.
// 3. Sends the customer a confirmation (wording: lib/email-templates.js).
// Then we call the customer, agree on the extras' price and book the installation.
// A package made with "Kendi paketini oluştur" (package "ozel") arrives with its
// contents in `custom`; its price is calculated again here (builder-core.js), so
// a changed price in the browser can't reach us. It has no extras.

import { json, sameOrigin, readBody, text, line, isEmail, passesTurnstile } from "../../lib/http.js";
import { emailConfigured, inbox, sendEmail, fieldsEmail, textToHtml } from "../../lib/email.js";
import { orderAutoReply } from "../../lib/email-templates.js";
import { findItem, formatMoney, toCents, depositCents } from "../../public/assets/js/pricing.js";
import { newOrderRef } from "../../lib/order-ref.js";
import { CUSTOM_ID, customPackage, customPrice, sizeOf, heatingOf, balconyText, roomSummary, questionOf } from "../../public/assets/js/builder-core.js";

const MAX_EXTRAS = 50;
const MAX_QTY = 20;

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);

  let body;
  try {
    body = await readBody(request);
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }
  if (body.website) return json({ ok: true }); // spam trap was filled in (no real order number for bots)

  const pkgId = line(body.package, 80);
  let pkg = null;
  if (pkgId === CUSTOM_ID) {
    try {
      pkg = customPackage(JSON.parse(String(body.custom || "").slice(0, 5000)));
    } catch {
      pkg = null;
    }
    if (!pkg) return json({ error: "Paketiniz okunamadı. Lütfen Paketler sayfasından paketinizi yeniden oluşturun." }, 400);
  } else {
    pkg = findItem(pkgId);
    if (!pkg || pkg.kind !== "package") pkg = null;
  }
  if (!pkg) {
    return json({ error: "Lütfen önce bir paket seçin." }, 400);
  }
  // "id:qty,id:qty" → only real products (no packages), quantities 1–20, duplicates merged
  const merged = new Map();
  for (const part of String(body.extras || "").split(",").slice(0, MAX_EXTRAS * 2)) {
    const [rawId, rawQty] = part.split(":");
    const item = findItem(String(rawId || "").trim());
    const qty = Math.floor(Number(rawQty ?? 1));
    if (!item || item.kind !== "product" || !(qty > 0)) continue;
    merged.set(item.id, { item, qty: Math.min((merged.get(item.id)?.qty || 0) + qty, MAX_QTY) });
  }
  const extras = pkg.custom ? [] : [...merged.values()].slice(0, MAX_EXTRAS);

  const form = {
    name: line(body.name, 100),
    email: line(body.email, 254),
    phone: line(body.phone, 40),
    address: line(body.address, 200),
    callTime: line(body.callTime, 80),
    wishes: text(body.wishes, 2000),
    message: text(body.message, 3000),
    depositSender: line(body.depositSender, 120),
  };
  if (!form.name || !isEmail(form.email) || !form.phone || !form.address || !body.consent) {
    return json({ error: "Lütfen adınızı, telefonunuzu, geçerli bir e-posta adresini ve kurulum adresini girin, onay kutusunu işaretleyin." }, 400);
  }
  if (!body.depositPaid || !form.depositSender) {
    return json({ error: "Talebi göndermeden önce %20 kaporayı havale/EFT ile gönderin, gönderen kişinin adını yazın ve kapora kutusunu işaretleyin." }, 400);
  }
  if (!(await passesTurnstile(env, body["cf-turnstile-response"], request.headers.get("CF-Connecting-IP")))) {
    return json({ error: "Spam kontrolü başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyin." }, 400);
  }
  const to = inbox(env, "sales");
  if (!emailConfigured(env) || !to) {
    return json({ error: "Sipariş sistemi henüz bağlı değil. Lütfen bizi arayın veya e-posta gönderin." }, 503);
  }

  const ticket = await newOrderRef(env);
  const depositLine = formatMoney(depositCents(pkg));
  const packageLine = `${pkg.name} – ${formatMoney(toCents(pkg.price))}`;
  const extrasText = pkg.custom
    ? pkg.items.map(({ id, qty }) => `• ${qty} × ${findItem(id).name}`).join("\n")
    : extras.length
      ? extras.map(({ item, qty }) => `• ${qty} × ${item.name}`).join("\n")
      : "Yok";
  const customRows = pkg.custom
    ? [
        ["Ev / ısıtma", `${sizeOf(pkg.size).label}${balconyText(pkg.balconies, ", ")} · ${heatingOf(pkg.heating).name}`],
        ["Paketteki ürünler", extrasText],
        ["Oda yerleşimi (müşterinin krokisi)", roomsText(pkg)],
        ["Soruların cevapları", answersText(pkg)],
        ["Fiyat hesabı (iç bilgi)", customPrice(pkg.items).steps.map(([label, cents]) => `${label}: ${formatMoney(cents)}`).join("\n")],
      ]
    : [["Ekstra ürünler (fiyat görüşülecek)", extrasText]];
  const totalLine = `${formatMoney(toCents(pkg.price))}${extras.length ? " + ek ürün fiyatları" : ""}`;

  try {
    await sendEmail(env, {
      to,
      replyTo: form.email,
      subject: `[${ticket}] Yeni paket talebi: ${pkg.name} – ${form.name}`,
      ...fieldsEmail(`Yeni paket talebi ${ticket}`, [
        ["Referans", ticket],
        ["Paket", packageLine],
        ...customRows,
        ["Toplam", totalLine],
        ["Kapora (%20, havale/EFT) — hesaptan kontrol edin", `${depositLine} · Gönderen: ${form.depositSender}`],
        ["İstedikleri (listede olmayan)", form.wishes],
        ["Ad soyad", form.name],
        ["Telefon", form.phone],
        ["E-posta", form.email],
        ["Kurulum adresi", form.address],
        ["Ne zaman aransın", form.callTime],
        ["Not", form.message],
      ]),
    });
  } catch (err) {
    console.error("order: sending to company failed", err);
    return json({ error: "Talebiniz gönderilemedi. Lütfen daha sonra tekrar deneyin veya bizi arayın." }, 502);
  }

  try {
    const reply = orderAutoReply({ ...form, ticket, packageLine, extrasText, totalLine, depositLine, custom: Boolean(pkg.custom) });
    await sendEmail(env, { to: form.email, replyTo: to, subject: reply.subject, text: reply.text, html: textToHtml(reply.text) });
  } catch (err) {
    console.error("order: auto-reply failed", err); // the request itself did arrive, so still report success
  }

  return json({ ok: true, ticket });
}


/** "Salon: 1 × Duvar ekranı, 1 × …" per room of the customer's floor plan. */
function roomsText(pkg) {
  const { rooms, unplaced } = roomSummary(pkg);
  const list = (items) => items.map(({ item, qty }) => `${qty} × ${item.name}`).join(", ");
  const lines = rooms.map((r) => `${r.label}: ${list(r.items)}`);
  if (unplaced.length) lines.push(`Odası seçilmemiş: ${list(unplaced)}`);
  return lines.join("\n") || "—";
}

/** "Evet: Kamera ve hırsız alarmı…" — what the customer answered in the builder. */
function answersText(pkg) {
  const lines = Object.entries(pkg.answers || {}).map(([id, yes]) => `${yes ? "Evet" : "Hayır"}: ${questionOf(id)?.title || id}`);
  return lines.join("\n") || "—";
}
