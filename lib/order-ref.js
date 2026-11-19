// Order numbers like PT-261119-7KQ2-H8M4Q.
// The last block is a signature (HMAC) of the rest, made with a secret that only
// the server knows. So the support form can check that a number really came from
// a package request on this site, without needing a database.
// Secret: Cloudflare variable ORDER_SECRET (recommended); falls back to
// RESEND_API_KEY so it works without extra setup. Changing the secret makes
// older order numbers invalid.

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no look-alikes like 0/O, 1/I
const SIG_LENGTH = 5;
export const ORDER_REF_PATTERN = /^PT-\d{6}-[A-HJ-NP-Z2-9]{4}-[A-HJ-NP-Z2-9]{5}$/;

function secretOf(env) {
  return env.ORDER_SECRET || env.RESEND_API_KEY || "";
}

async function signature(env, body) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secretOf(env)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body)));
  return [...mac.slice(0, SIG_LENGTH)].map((b) => CHARS[b % CHARS.length]).join("");
}

/** A new, signed order number. */
export async function newOrderRef(env) {
  const d = new Date();
  const date = `${String(d.getUTCFullYear()).slice(2)}${String(d.getUTCMonth() + 1).padStart(2, "0")}${String(d.getUTCDate()).padStart(2, "0")}`;
  const random = [...crypto.getRandomValues(new Uint8Array(4))].map((b) => CHARS[b % CHARS.length]).join("");
  const body = `PT-${date}-${random}`;
  return `${body}-${await signature(env, body)}`;
}

/** Tidies what a customer typed: spaces removed, upper case. */
export function normalizeOrderRef(value) {
  return String(value || "").replace(/\s+/g, "").toUpperCase();
}

/** True when the order number was issued by this site. */
export async function isValidOrderRef(env, value) {
  const ref = normalizeOrderRef(value);
  if (!ORDER_REF_PATTERN.test(ref) || !secretOf(env)) return false;
  const body = ref.slice(0, ref.lastIndexOf("-"));
  const given = ref.slice(ref.lastIndexOf("-") + 1);
  return (await signature(env, body)) === given;
}
