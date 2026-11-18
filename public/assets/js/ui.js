// Small shared helpers: icons, escaping, product images, the "added to cart" toast.

const ICONS = {
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.4 11.4a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.5-1.2L21 7H6"/>',
  box: '<path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v8"/>',
  layers: '<path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><path d="M9 3v3M15 3v3M9 18v3M15 18v3M3 9h3M3 15h3M18 9h3M18 15h3"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v.1h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>',
  plug: '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0V8Z"/><path d="M12 17v4"/>',
  sensor: '<circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
  thermo: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/><path d="M12 9v7"/>',
};

export function icon(name, className = "icon") {
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[name] || ICONS.box}</svg>`;
}

export function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function placeholderIcon(item) {
  if (item.kind === "package" || item.items) return "layers";
  const c = (item.category || "").toLowerCase();
  if (/hub|controller/.test(c)) return "cpu";
  if (/light/.test(c)) return "bulb";
  if (/plug|switch/.test(c)) return "plug";
  if (/sensor|security/.test(c)) return "sensor";
  if (/climate|heat/.test(c)) return "thermo";
  return "box";
}

/** Product photo, or a neutral icon placeholder when no image is set. */
export function mediaHtml(item) {
  if (item.image) return `<img src="${escapeHtml(item.image)}" alt="" loading="lazy">`;
  return `<span class="media-placeholder">${icon(placeholderIcon(item))}</span>`;
}

let toastEl;
let toastTimer;

export function ensureToast() {
  if (toastEl) return toastEl;
  toastEl = document.createElement("div");
  toastEl.className = "toast";
  toastEl.setAttribute("role", "status");
  toastEl.setAttribute("aria-live", "polite");
  document.body.append(toastEl);
  return toastEl;
}

export function toast(message, link) {
  const el = ensureToast();
  el.innerHTML = `${icon("check")}<span>${escapeHtml(message)}</span>${
    link ? `<a href="${escapeHtml(link.href)}">${escapeHtml(link.text)}</a>` : ""
  }`;
  el.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-visible"), 4000);
}
