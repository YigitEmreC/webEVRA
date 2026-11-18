// POST /api/support — the maintenance / technical support portal.
// 1. Creates a reference number like SR-261117-7KQ2.
// 2. E-mails the request to SUPPORT_TO (falls back to CONTACT_TO).
// 3. Sends the customer a confirmation with the reference (lib/email-templates.js).

import { json, sameOrigin, readBody, text, line, isEmail, passesTurnstile } from "../../lib/http.js";
import { emailConfigured, sendEmail, fieldsEmail, textToHtml } from "../../lib/email.js";
import { supportAutoReply } from "../../lib/email-templates.js";
import { findItem } from "../../public/assets/js/pricing.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ error: "Forbidden." }, 403);

  let body;
  try {
    body = await readBody(request);
  } catch {
    return json({ error: "Invalid request." }, 400);
  }
  if (body.website) return json({ ok: true, ticket: ticketId() }); // spam trap was filled in

  const form = {
    type: line(body.type, 80) || "Technical support",
    urgency: line(body.urgency, 80) || "Normal",
    name: line(body.name, 100),
    email: line(body.email, 254),
    phone: line(body.phone, 40),
    reference: line(body.reference, 60),
    address: line(body.address, 200),
    product: findItem(line(body.product, 80))?.name || "",
    date: /^\d{4}-\d{2}-\d{2}$/.test(body.date || "") ? body.date : "",
    message: text(body.message, 5000),
  };
  if (!form.name || !isEmail(form.email) || !form.message || !body.consent) {
    return json({ error: "Please fill in your name, a valid e-mail address and a description, and tick the consent box." }, 400);
  }
  if (!(await passesTurnstile(env, body["cf-turnstile-response"], request.headers.get("CF-Connecting-IP")))) {
    return json({ error: "The spam check failed. Please reload the page and try again." }, 400);
  }
  const to = env.SUPPORT_TO || env.CONTACT_TO;
  if (!emailConfigured(env) || !to) {
    return json({ error: "The support portal isn't connected yet. Please e-mail or call us directly." }, 503);
  }

  const ticket = ticketId();
  try {
    await sendEmail(env, {
      to,
      replyTo: form.email,
      subject: `[${ticket}] ${form.type} (${form.urgency}) – ${form.name}`,
      ...fieldsEmail(`Support request ${ticket}`, [
        ["Reference", ticket],
        ["Request", form.type],
        ["Urgency", form.urgency],
        ["Name", form.name],
        ["E-mail", form.email],
        ["Phone", form.phone],
        ["Order / customer no.", form.reference],
        ["Address", form.address],
        ["Product / package", form.product],
        ["Preferred visit date", form.date],
        ["Description", form.message],
      ]),
    });
  } catch (err) {
    console.error("support: sending to company failed", err);
    return json({ error: "Your request couldn't be sent. Please try again later or contact us directly." }, 502);
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
