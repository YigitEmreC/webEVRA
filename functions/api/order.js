// POST /api/order — a package request from the "Siparişim" page (/cart.html).
// There is no online payment. This:
// 1. Creates a reference number like PT-261119-7KQ2.
// 2. E-mails the request (package, extra products, contact details) to the sales
//    inbox: satis@ (settings.js → email.sales). Pressing Reply goes to the customer.
// 3. Sends the customer a confirmation (wording: lib/email-templates.js).
// Then we call the customer, agree on the extras' price and book the installation.

import { json, sameOrigin, readBody, text, line, isEmail, passesTurnstile } from "../../lib/http.js";
import { emailConfigured, inbox, sendEmail, fieldsEmail, textToHtml } from "../../lib/email.js";
import { orderAutoReply } from "../../lib/email-templates.js";
import { findItem, formatMoney, toCents } from "../../public/assets/js/pricing.js";

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
  if (body.website) return json({ ok: true, ticket: ticketId() }); // spam trap was filled in

  const pkg = findItem(line(body.package, 80));
  if (!pkg || pkg.kind !== "package") {
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
  const extras = [...merged.values()].slice(0, MAX_EXTRAS);

  const form = {
    name: line(body.name, 100),
    email: line(body.email, 254),
    phone: line(body.phone, 40),
    address: line(body.address, 200),
    callTime: line(body.callTime, 80),
    wishes: text(body.wishes, 2000),
    message: text(body.message, 3000),
  };
  if (!form.name || !isEmail(form.email) || !form.phone || !form.address || !body.consent) {
    return json({ error: "Lütfen adınızı, telefonunuzu, geçerli bir e-posta adresini ve kurulum adresini girin, onay kutusunu işaretleyin." }, 400);
  }
  if (!(await passesTurnstile(env, body["cf-turnstile-response"], request.headers.get("CF-Connecting-IP")))) {
    return json({ error: "Spam kontrolü başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyin." }, 400);
  }
  const to = inbox(env, "sales");
  if (!emailConfigured(env) || !to) {
    return json({ error: "Sipariş sistemi henüz bağlı değil. Lütfen bizi arayın veya e-posta gönderin." }, 503);
  }

  const ticket = ticketId();
  const packageLine = `${pkg.name} – ${formatMoney(toCents(pkg.price))}`;
  const extrasText = extras.length ? extras.map(({ item, qty }) => `• ${qty} × ${item.name}`).join("\n") : "Yok";
  const totalLine = `${formatMoney(toCents(pkg.price))}${extras.length ? " + ek ürün fiyatları" : ""}`;

  try {
    await sendEmail(env, {
      to,
      replyTo: form.email,
      subject: `[${ticket}] Yeni paket talebi: ${pkg.name} – ${form.name}`,
      ...fieldsEmail(`Yeni paket talebi ${ticket}`, [
        ["Referans", ticket],
        ["Paket", packageLine],
        ["Ekstra ürünler (fiyat görüşülecek)", extrasText],
        ["Toplam", totalLine],
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
    const reply = orderAutoReply({ ...form, ticket, packageLine, extrasText, totalLine });
    await sendEmail(env, { to: form.email, replyTo: to, subject: reply.subject, text: reply.text, html: textToHtml(reply.text) });
  } catch (err) {
    console.error("order: auto-reply failed", err); // the request itself did arrive, so still report success
  }

  return json({ ok: true, ticket });
}

/** e.g. PT-261119-7KQ2: date + 4 random characters (no look-alikes like 0/O, 1/I). */
function ticketId() {
  const d = new Date();
  const date = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  return `PT-${date}-${[...bytes].map((b) => chars[b % chars.length]).join("")}`;
}
