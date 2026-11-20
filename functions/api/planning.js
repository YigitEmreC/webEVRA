// POST /api/planning — the planning form for 5+1 and larger homes (Packages page →
// "Kendi paketini oluştur" → "5+1 ve üzeri"). These homes get no instant price:
// 1. E-mails the request to the sales inbox (satis@, settings.js → email.sales).
//    Pressing Reply goes straight to the customer.
// 2. Sends the customer a confirmation (wording: lib/email-templates.js).

import { json, sameOrigin, readBody, text, line, isEmail, passesTurnstile } from "../../lib/http.js";
import { emailConfigured, inbox, sendEmail, fieldsEmail, textToHtml } from "../../lib/email.js";
import { planningAutoReply } from "../../lib/email-templates.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);

  let body;
  try {
    body = await readBody(request);
  } catch {
    return json({ error: "Geçersiz istek." }, 400);
  }
  if (body.website) return json({ ok: true }); // spam trap was filled in

  const interests = Object.keys(body)
    .filter((k) => k.startsWith("interest_"))
    .map((k) => line(body[k], 60))
    .filter(Boolean)
    .slice(0, 12);
  const form = {
    name: line(body.name, 100),
    email: line(body.email, 254),
    phone: line(body.phone, 40),
    city: line(body.city, 120),
    homeType: line(body.homeType, 60),
    size: line(body.size, 40),
    area: line(body.area, 10),
    floors: line(body.floors, 10),
    heating: line(body.heating, 80),
    interests: interests.join(", "),
    callTime: line(body.callTime, 80),
    message: text(body.message, 3000),
  };
  if (!form.name || !isEmail(form.email) || !form.phone || !form.city || !body.consent) {
    return json({ error: "Lütfen adınızı, telefonunuzu, geçerli bir e-posta adresini ve ilçe/il bilgisini girin, onay kutusunu işaretleyin." }, 400);
  }
  if (!(await passesTurnstile(env, body["cf-turnstile-response"], request.headers.get("CF-Connecting-IP")))) {
    return json({ error: "Spam kontrolü başarısız oldu. Lütfen sayfayı yenileyip tekrar deneyin." }, 400);
  }
  const to = inbox(env, "sales");
  if (!emailConfigured(env) || !to) {
    return json({ error: "Form henüz bağlı değil. Lütfen bizi arayın veya e-posta gönderin." }, 503);
  }

  try {
    await sendEmail(env, {
      to,
      replyTo: form.email,
      subject: `Planlama talebi (${form.size}): ${form.name} – ${form.city}`,
      ...fieldsEmail("Büyük ev için planlama talebi", [
        ["Ad soyad", form.name],
        ["Telefon", form.phone],
        ["E-posta", form.email],
        ["İlçe / il", form.city],
        ["Ev tipi", form.homeType],
        ["Oda sayısı", form.size],
        ["Alan (m²)", form.area],
        ["Kat sayısı", form.floors],
        ["Isıtma sistemi", form.heating],
        ["İstedikleri", form.interests],
        ["Ne zaman aransın", form.callTime],
        ["Not", form.message],
      ]),
    });
  } catch (err) {
    console.error("planning: sending to company failed", err);
    return json({ error: "Talebiniz gönderilemedi. Lütfen daha sonra tekrar deneyin veya bizi arayın." }, 502);
  }

  try {
    const reply = planningAutoReply(form);
    await sendEmail(env, { to: form.email, replyTo: to, subject: reply.subject, text: reply.text, html: textToHtml(reply.text) });
  } catch (err) {
    console.error("planning: auto-reply failed", err); // the request itself did arrive, so still report success
  }

  return json({ ok: true });
}
