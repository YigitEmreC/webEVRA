// Sends e-mail through Resend (https://resend.com) using its HTTP API.
// Needs RESEND_API_KEY (Cloudflare secret). Sender and inboxes come from
// public/data/settings.js → email, unless overridden by Cloudflare variables.
// To use another provider, only sendEmail() below needs to change.

import { settings } from "../public/data/settings.js";

export function emailConfigured(env) {
  return Boolean(env.RESEND_API_KEY);
}

/** Inbox for a form: "info", "sales" or "support". */
export function inbox(env, kind) {
  const override = { info: env.CONTACT_TO, sales: env.SALES_TO, support: env.SUPPORT_TO }[kind];
  return override || settings.email[kind];
}

export async function sendEmail(env, { to, subject, text, html, replyTo }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.MAIL_FROM || settings.email.from,
      to: [to],
      subject: subject.replace(/[\r\n]+/g, " "),
      text,
      html,
      ...(replyTo ? { reply_to: replyTo } : {}),
    }),
  });
  if (!res.ok) throw new Error(`Resend responded ${res.status}: ${await res.text()}`);
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

/** Plain text → simple HTML paragraphs. */
export function textToHtml(body) {
  return body
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

/** A labelled list of form fields, as both text and HTML, for the e-mails you receive. */
export function fieldsEmail(title, rows) {
  const filled = rows.filter(([, value]) => value);
  const text = `${title}\n\n${filled.map(([label, value]) => `${label}:\n${value}`).join("\n\n")}`;
  const html = `<h2 style="font-family:sans-serif">${escapeHtml(title)}</h2>
<table style="font-family:sans-serif;border-collapse:collapse">${filled
    .map(
      ([label, value]) =>
        `<tr><th style="text-align:left;vertical-align:top;padding:6px 16px 6px 0;color:#555">${escapeHtml(label)}</th><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(value)}</td></tr>`
    )
    .join("")}</table>`;
  return { text, html };
}
