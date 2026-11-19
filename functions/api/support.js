// POST /api/support — the maintenance / technical support portal.
// Only customers with a package order can use it: the order number
// (PT-…, signed, see lib/order-ref.js) is checked first.
// 1. Creates a reference number like SR-261117-7KQ2.
// 2. E-mails the request to destek@ (settings.js → email.support).
// 3. Sends the customer a confirmation with the reference (lib/email-templates.js).

import { json, sameOrigin, readBody, text, line, isEmail, passesTurnstile } from "../../lib/http.js";
import { emailConfigured, inbox, sendEmail, fieldsEmail, textToHtml } from "../../lib/email.js";
import { supportAutoReply } from "../../lib/email-templates.js";
import { findItem } from "../../public/assets/js/pricing.js";
import { isValidOrderRef, normalizeOrderRef } from "../../lib/order-ref.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);

  let body;
  try {
    body = await readBody(request);
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }
  if (body.website) return json({ ok: true, ticket: ticketId() }); // spam trap was filled in

  const form = {
    type: line(body.type, 80) || "Teknik destek",
    urgency: line(body.urgency, 80) || "Normal",
    name: line(body.name, 100),
    email: line(body.email, 254),
    phone: line(body.phone, 40),
    reference: normalizeOrderRef(line(body.reference, 60)),
    address: line(body.address, 200),
    product: findItem(line(body.product, 80))?.name || "",
    date: /^\d{4}-\d{2}-\d{2}$/.test(body.date || "") ? body.date : "",
    message: text(body.message, 5000),
  };
  if (!form.name || !isEmail(form.email) || !form.message || !body.consent) {
    return json({ error: "Lütfen adınızı, geçerli bir e-posta adresini ve sorun açıklamasını girin, onay kutusunu işaretleyin." }, 400);
  }
  if (!(await passesTurnstile(env, body["cf-turnstile-response"], request.headers.get("CF-Connecting-IP")))) {
    return json({ error: "Spam kontrolü başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyin." }, 400);
  }
  if (!(await isValidOrderRef(env, form.reference))) {
    return json({ error: "Geçerli bir sipariş numarası girin (örn. PT-261119-7KQ2-H8M4Q). Numaranız paket talebinizden sonra gelen onay e-postasında yazar." }, 400);
  }
  const to = inbox(env, "support");
  if (!emailConfigured(env) || !to) {
    return json({ error: "Destek portalı henüz bağlı değil. Lütfen bize e-posta gönderin veya telefonla ulaşın." }, 503);
  }

  const ticket = ticketId();
  try {
    await sendEmail(env, {
      to,
      replyTo: form.email,
      subject: `[${ticket}] ${form.type} (${form.urgency}) – ${form.name}`,
      ...fieldsEmail(`Destek talebi ${ticket}`, [
        ["Referans", ticket],
        ["Talep", form.type],
        ["Aciliyet", form.urgency],
        ["Ad soyad", form.name],
        ["E-posta", form.email],
        ["Telefon", form.phone],
        ["Sipariş no (doğrulandı)", form.reference],
        ["Adres", form.address],
        ["Ürün / paket", form.product],
        ["Tercih edilen ziyaret tarihi", form.date],
        ["Açıklama", form.message],
      ]),
    });
  } catch (err) {
    console.error("support: sending to company failed", err);
    return json({ error: "Talebiniz gönderilemedi. Lütfen daha sonra tekrar deneyin veya bize doğrudan ulaşın." }, 502);
  }

  try {
    const reply = supportAutoReply({ ...form, ticket });
    await sendEmail(env, { to: form.email, replyTo: to, subject: reply.subject, text: reply.text, html: textToHtml(reply.text) });
  } catch (err) {
    console.error("support: auto-reply failed", err);
  }

  return json({ ok: true, ticket });
}

/** e.g. SR-261117-7KQ2: date + 4 random characters (no look-alikes like 0/O, 1/I). */
function ticketId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // 32 characters, so no bias
  const random = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => alphabet[b % 32]).join("");
  return `SR-${new Date().toISOString().slice(2, 10).replace(/-/g, "")}-${random}`;
}
