// POST /api/contact — the contact form's "e-mail bot".
// 1. E-mails the message to info@ — or satis@ for sales topics (see settings.js → email).
//    Pressing Reply goes straight to the visitor.
// 2. Sends the visitor an automatic confirmation (wording: lib/email-templates.js).

import { json, sameOrigin, readBody, text, line, isEmail, passesTurnstile } from "../../lib/http.js";
import { emailConfigured, inbox, sendEmail, fieldsEmail, textToHtml } from "../../lib/email.js";
import { settings } from "../../public/data/settings.js";
import { contactAutoReply } from "../../lib/email-templates.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);

  let body;
  try {
    body = await readBody(request);
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (body.website) return json({ ok: true }); // spam trap was filled in

  const form = {
    name: line(body.name, 100),
    email: line(body.email, 254),
    phone: line(body.phone, 40),
    topic: line(body.topic, 80) || "Genel soru",
    message: text(body.message, 5000),
  };
  if (!form.name || !isEmail(form.email) || !form.message || !body.consent) {
    return json({ error: "Lütfen adınızı, geçerli bir e-posta adresini ve mesajınızı girin, onay kutusunu işaretleyin." }, 400);
  }
  if (!(await passesTurnstile(env, body["cf-turnstile-response"], request.headers.get("CF-Connecting-IP")))) {
    return json({ error: "Spam kontrolü başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyin." }, 400);
  }
  const to = settings.email.salesTopics.includes(form.topic) ? inbox(env, "sales") : inbox(env, "info");
  if (!emailConfigured(env) || !to) {
    return json({ error: "İletişim formu henüz bağlı değil. Lütfen bize doğrudan e-posta gönderin." }, 503);
  }

  try {
    await sendEmail(env, {
      to,
      replyTo: form.email,
      subject: `Web sitesi: ${form.topic} – ${form.name}`,
      ...fieldsEmail("İletişim formundan yeni mesaj", [
        ["Ad soyad", form.name],
        ["E-posta", form.email],
        ["Telefon", form.phone],
        ["Konu", form.topic],
        ["Mesaj", form.message],
      ]),
    });
  } catch (err) {
    console.error("contact: sending to company failed", err);
    return json({ error: "Mesajınız gönderilemedi. Lütfen daha sonra tekrar deneyin veya bize doğrudan e-posta gönderin." }, 502);
  }

  try {
    const reply = contactAutoReply(form);
    await sendEmail(env, { to: form.email, replyTo: to, subject: reply.subject, text: reply.text, html: textToHtml(reply.text) });
  } catch (err) {
    console.error("contact: auto-reply failed", err); // the message itself did arrive, so still report success
  }

  return json({ ok: true });
}
