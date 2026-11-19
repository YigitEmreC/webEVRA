// Small helpers shared by the Cloudflare Pages Functions in /functions.

export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

/** Rejects form posts made from other websites. */
export function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

export async function readBody(request) {
  const type = request.headers.get("content-type") || "";
  if (type.includes("application/json")) return (await request.json()) || {};
  return Object.fromEntries(await request.formData());
}

/** Multi-line text: trimmed, normalised line endings, length-capped. */
export function text(value, max = 5000) {
  return String(value ?? "").replace(/\r\n?/g, "\n").trim().slice(0, max);
}

/** Single-line text: no line breaks, collapsed whitespace, length-capped. */
export function line(value, max = 200) {
  return String(value ?? "").replace(/\s+/g, " ").trim().slice(0, max);
}

export function isEmail(value) {
  return value.length <= 254 && /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(value);
}

/**
 * Cloudflare Turnstile check. Only enforced when TURNSTILE_SECRET_KEY is set,
 * so the forms keep working before you've set Turnstile up.
 */
export async function passesTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  if (!token) return false;
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: String(token), remoteip: ip || "" }),
  });
  const data = await res.json().catch(() => ({}));
  return data.success === true;
}
