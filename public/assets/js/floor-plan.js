// Bird's-eye floor plan (kroki) for "Kendi paketini oluştur", drawn as SVG from
// the number of bedrooms and balconies. It is an illustration, not the
// customer's real plan. Pure functions only (no DOM): the server also uses
// planRooms() to check the rooms a package refers to.
//
// Layout: bedrooms and a bathroom along the top, a hallway (hol) with the
// entrance in the middle, living room (salon), kitchen and (3+1 and bigger) a
// second bathroom at the bottom, and the balconies in a row underneath.
// Every room has an id (bed1, bath1, hall, living, kitchen, bath2, balcony1 …);
// products placed in a room show as small emblems on it (emblemsSvg).

const X0 = 12;
const Y0 = 12;
const W = 376;
const TOP_H = 118;
const HALL_H = 36;
const BOTTOM_H = 104;
const H = TOP_H + HALL_H + BOTTOM_H;
const BALCONY_H = 46;
const DOOR = 22;
const EMBLEM = 18;
const STEP = 21;

const r = (n) => Math.round(n * 10) / 10;

// Floor texture of each kind of room (<pattern> ids in floorPlanSvg).
const TEXTURE = { bed: "fp-wood", living: "fp-wood", hall: "fp-hall", bath: "fp-tile", kitchen: "fp-tile", balcony: "fp-deck" };

/** Room geometry for a home: [{ id, kind, label, x, y, w, h, labelY, area }], plus the drawing height. */
export function planLayout(bedrooms, balconies = 0) {
  bedrooms = Math.max(1, Math.min(Number(bedrooms) || 1, 6));
  balconies = Math.max(0, Math.min(Number(balconies) || 0, 6));
  const rooms = [];

  // Top row: bedrooms with the bathroom after the first one.
  const top = [];
  for (let i = 1; i <= bedrooms; i++) top.push({ id: `bed${i}`, kind: "bed", label: i === 1 ? "Yatak odası" : `Oda ${i}`, weight: 1 });
  top.splice(1, 0, { id: "bath1", kind: "bath", label: "Banyo", weight: 0.62 });
  const weights = top.reduce((sum, t) => sum + t.weight, 0);
  let x = X0;
  for (const t of top) {
    const w = (W * t.weight) / weights;
    rooms.push({ ...t, x, y: Y0, w, h: TOP_H, labelY: Y0 + TOP_H - 32, area: { x: x + 5, y: Y0 + 5, w: w - 10, h: TOP_H - 48 } });
    x += w;
  }

  // Hallway (entrance on the left).
  const hy = Y0 + TOP_H;
  rooms.push({ id: "hall", kind: "hall", label: "Hol", x: X0, y: hy, w: W, h: HALL_H, labelY: hy + HALL_H / 2 + 4, labelX: X0 + W - 26, area: { x: X0 + 62, y: hy + (HALL_H - EMBLEM) / 2, w: W - 120, h: EMBLEM } });

  // Bottom row.
  const by = hy + HALL_H;
  const secondBath = bedrooms >= 3;
  const livingW = W * (secondBath ? 0.52 : 0.62);
  const kitchenW = W * (secondBath ? 0.3 : 0.38);
  const kx = X0 + livingW;
  rooms.push({ id: "living", kind: "living", label: "Salon", x: X0, y: by, w: livingW, h: BOTTOM_H, labelY: by + 20, area: { x: X0 + 6, y: by + 28, w: livingW - 12, h: BOTTOM_H - 34 } });
  rooms.push({ id: "kitchen", kind: "kitchen", label: "Mutfak", x: kx, y: by, w: kitchenW, h: BOTTOM_H, labelY: by + BOTTOM_H - 12, area: { x: kx + 6, y: by + 28, w: kitchenW - 12, h: BOTTOM_H - 50 } });
  if (secondBath) {
    const bx = kx + kitchenW;
    const bw = W - livingW - kitchenW;
    rooms.push({ id: "bath2", kind: "bath", label: "Banyo 2", x: bx, y: by, w: bw, h: BOTTOM_H, labelY: by + BOTTOM_H - 12, area: { x: bx + 5, y: by + 28, w: bw - 10, h: BOTTOM_H - 50 } });
  }

  // Balconies in a row under the home; the drawing grows to fit them.
  const yb = Y0 + H;
  const gap = 10;
  const bw = Math.min(150, (W - gap * (balconies + 1)) / Math.max(balconies, 1));
  const startX = X0 + (W - (bw * balconies + gap * (balconies - 1))) / 2;
  for (let i = 1; i <= balconies; i++) {
    const bx = startX + (i - 1) * (bw + gap);
    rooms.push({
      id: `balcony${i}`,
      kind: "balcony",
      label: balconies === 1 ? "Balkon" : `Balkon ${i}`,
      x: bx,
      y: yb,
      w: bw,
      h: BALCONY_H,
      labelY: yb + BALCONY_H - 8,
      area: { x: bx + 5, y: yb + 5, w: bw - 10, h: EMBLEM },
    });
  }

  return { rooms, height: yb + (balconies ? BALCONY_H + 4 : 0) + 2, livingW, kitchenW, secondBath };
}

/** Room ids and names, e.g. [{ id: "living", label: "Salon", kind: "living" }]. */
export function planRooms(bedrooms, balconies = 0) {
  return planLayout(bedrooms, balconies).rooms.map(({ id, label, kind }) => ({ id, label, kind }));
}

/** A potted plant seen from above. */
function plant(x, y, size = 7) {
  return `<g class="fp-plant"><circle cx="${r(x)}" cy="${r(y)}" r="${size}"/><circle cx="${r(x - size * 0.35)}" cy="${r(y - size * 0.3)}" r="${r(size * 0.45)}"/><circle cx="${r(x + size * 0.4)}" cy="${r(y + size * 0.2)}" r="${r(size * 0.4)}"/></g>`;
}

/** Furniture seen from above so the rooms read at a glance (hidden once a room has products). */
function furniture(room) {
  const { kind, x, y, w, h } = room;
  const cx = x + w / 2;
  switch (kind) {
    case "bed": {
      const bw = Math.min(w * 0.5, 46);
      const bh = Math.min(h * 0.46, 54);
      const bx = cx - bw / 2;
      const by = y + 8;
      const ns = Math.min(10, (w - bw) / 2 - 6);
      return `
        <rect class="fp-solid" x="${r(bx)}" y="${r(by)}" width="${r(bw)}" height="${r(bh)}" rx="4"/>
        <rect class="fp-soft" x="${r(bx + 4)}" y="${r(by + 4)}" width="${r(bw / 2 - 6)}" height="9" rx="3"/>
        <rect class="fp-soft" x="${r(bx + bw / 2 + 2)}" y="${r(by + 4)}" width="${r(bw / 2 - 6)}" height="9" rx="3"/>
        <path class="fp-blanket" d="M${r(bx + 2)} ${r(by + bh * 0.42)}H${r(bx + bw - 2)}V${r(by + bh - 2)}H${r(bx + 2)}Z"/>
        <path d="M${r(bx + 2)} ${r(by + bh * 0.42 + 5)}H${r(bx + bw - 2)}"/>
        ${ns >= 6 ? `<rect class="fp-solid" x="${r(bx - ns - 3)}" y="${r(by + 1)}" width="${r(ns)}" height="${r(ns)}" rx="2"/><rect class="fp-solid" x="${r(bx + bw + 3)}" y="${r(by + 1)}" width="${r(ns)}" height="${r(ns)}" rx="2"/>` : ""}
        ${w > 70 ? plant(x + 11, y + h - 12, 5.5) : ""}`;
    }
    case "bath": {
      const top = room.id === "bath1" ? y + 8 : y + 28;
      const tw = Math.min(w - 26, 22);
      return `
        <rect class="fp-solid" x="${r(x + 6)}" y="${r(top)}" width="${r(tw)}" height="40" rx="7"/>
        <rect class="fp-water" x="${r(x + 9)}" y="${r(top + 3)}" width="${r(tw - 6)}" height="34" rx="5"/>
        <rect class="fp-solid" x="${r(x + w - 15)}" y="${r(top)}" width="10" height="5" rx="1.5"/>
        <ellipse class="fp-solid" cx="${r(x + w - 10)}" cy="${r(top + 12)}" rx="5" ry="7"/>
        <rect class="fp-solid" x="${r(x + w - 17)}" y="${r(top + 26)}" width="12" height="10" rx="3"/>
        <circle cx="${r(x + w - 11)}" cy="${r(top + 31)}" r="2"/>`;
    }
    case "living": {
      const sw = Math.min(w * 0.55, 122);
      const sx = cx - sw / 2;
      const sy = y + h - 30;
      return `
        <ellipse class="fp-rug" cx="${r(cx)}" cy="${r(sy - 14)}" rx="${r(sw * 0.45)}" ry="20"/>
        <path class="fp-solid" d="M${r(sx)} ${r(sy)}h${r(sw)}v22h${r(-sw)}Z"/>
        <path class="fp-soft" d="M${r(sx + 6)} ${r(sy + 2)}h${r(sw - 12)}v10h${r(-(sw - 12))}Z"/>
        <path d="M${r(sx + sw / 3)} ${r(sy + 2)}v10M${r(sx + (sw * 2) / 3)} ${r(sy + 2)}v10"/>
        <rect class="fp-wood-solid" x="${r(cx - 20)}" y="${r(sy - 25)}" width="40" height="16" rx="4"/>
        <rect class="fp-solid" x="${r(x + 8)}" y="${r(sy - 30)}" width="20" height="20" rx="5"/>
        ${plant(x + w - 13, y + 14, 7)}`;
    }
    case "kitchen": {
      const cxr = x + w - 15;
      return `
        <rect class="fp-solid" x="${r(x + w - 24)}" y="${r(y + 26)}" width="18" height="${r(h - 46)}" rx="2"/>
        <rect class="fp-water" x="${r(cxr - 5)}" y="${r(y + 32)}" width="10" height="12" rx="3"/>
        <circle cx="${r(cxr - 3)}" cy="${r(y + 54)}" r="3"/><circle cx="${r(cxr + 3)}" cy="${r(y + 54)}" r="3"/>
        <circle cx="${r(cxr - 3)}" cy="${r(y + 62)}" r="3"/><circle cx="${r(cxr + 3)}" cy="${r(y + 62)}" r="3"/>
        ${w > 90 ? `<circle class="fp-wood-solid" cx="${r(x + (w - 24) / 2)}" cy="${r(y + h / 2 - 4)}" r="13"/>
        <circle class="fp-solid" cx="${r(x + (w - 24) / 2 - 19)}" cy="${r(y + h / 2 - 4)}" r="4.5"/><circle class="fp-solid" cx="${r(x + (w - 24) / 2 + 19)}" cy="${r(y + h / 2 - 4)}" r="4.5"/>
        <circle class="fp-solid" cx="${r(x + (w - 24) / 2)}" cy="${r(y + h / 2 - 23)}" r="4.5"/>` : ""}`;
    }
    case "hall":
      return `<rect class="fp-wood-solid" x="${r(x + 78)}" y="${r(y + 5)}" width="34" height="9" rx="2"/>${plant(x + 124, y + 11, 5)}`;
    case "balcony":
      return `${plant(x + 11, y + 12, 6)}${w > 70 ? `<circle class="fp-solid" cx="${r(x + w - 16)}" cy="${r(y + 14)}" r="7"/>` : ""}`;
    default:
      return "";
  }
}

function doorAt(x, y, swing) {
  return `<rect class="fp-gap" x="${r(x)}" y="${r(y - 3)}" width="${DOOR}" height="6"/>
    <path class="fp-door" d="M${r(x)} ${r(y)}l0 ${r(swing * DOOR)}M${r(x)} ${r(y + swing * DOOR)}A${DOOR} ${DOOR} 0 0 ${swing > 0 ? 0 : 1} ${r(x + DOOR)} ${r(y)}"/>`;
}

const windowH = (x, y, w) => `<rect class="fp-window" x="${r(x)}" y="${r(y - 3)}" width="${r(w)}" height="6"/>`;
const windowV = (x, y, h) => `<rect class="fp-window" x="${r(x - 3)}" y="${r(y)}" width="6" height="${r(h)}"/>`;

/**
 * SVG markup of the plan. Rooms are clickable when `interactive` (data-room).
 * Product emblems go into the empty <g data-emblems> (see emblemsSvg), so they
 * can change without redrawing (and re-animating) the plan.
 */
export function floorPlanSvg({ bedrooms, balconies = 0, caption = "", interactive = false }) {
  const layout = planLayout(bedrooms, balconies);
  const { rooms, height, livingW, kitchenW, secondBath } = layout;
  let roomsHtml = "";
  let walls = "";
  let doors = "";
  let windows = "";

  rooms.forEach((room, i) => {
    const attrs = interactive ? ` data-room="${room.id}" tabindex="0" role="button" aria-label="${room.label}: ürün ekle veya çıkar"` : "";
    roomsHtml += `
      <g class="fp-room fp-${room.kind}" style="--i:${i}"${attrs}>
        <rect class="fp-fill" x="${r(room.x)}" y="${r(room.y)}" width="${r(room.w)}" height="${r(room.h)}"/>
        <rect class="fp-texture" x="${r(room.x)}" y="${r(room.y)}" width="${r(room.w)}" height="${r(room.h)}" fill="url(#${TEXTURE[room.kind]})"/>
        ${room.kind === "balcony" ? `<path class="fp-rail" d="M${r(room.x)} ${r(room.y)}V${r(room.y + room.h)}H${r(room.x + room.w)}V${r(room.y)}"/>` : ""}
        <g class="fp-furn">${furniture(room)}</g>
        <text class="fp-label" x="${r(room.labelX ?? room.x + room.w / 2)}" y="${r(room.labelY)}">${room.label}</text>
      </g>`;
  });

  // Inner walls, doors and windows.
  const top = rooms.filter((t) => t.y === Y0);
  top.forEach((t, i) => {
    if (i > 0) walls += `<path class="fp-wall-in" d="M${r(t.x)} ${Y0}V${Y0 + TOP_H}"/>`;
    doors += doorAt(t.x + t.w - DOOR - 6, Y0 + TOP_H, -1);
    windows += windowH(t.x + t.w * 0.25, Y0, t.w * 0.5);
  });
  const hy = Y0 + TOP_H;
  const by = hy + HALL_H;
  const kx = X0 + livingW;
  walls += `<path class="fp-wall-in" d="M${X0} ${hy}H${X0 + W}M${X0} ${by}H${X0 + W}M${r(kx)} ${by}V${by + BOTTOM_H}"/>`;
  doors += `<rect class="fp-gap" x="${X0 - 3}" y="${r(hy + (HALL_H - DOOR) / 2)}" width="6" height="${DOOR}"/>`; // entrance
  doors += `<rect class="fp-gap" x="${r(X0 + livingW * 0.35)}" y="${by - 3}" width="${r(livingW * 0.3)}" height="6"/>`; // open passage
  doors += doorAt(kx + 6, by, 1);
  windows += windowH(X0 + livingW * 0.1, by + BOTTOM_H, livingW * 0.22);
  windows += windowH(kx + kitchenW * 0.3, by + BOTTOM_H, kitchenW * 0.4);
  if (secondBath) {
    const bx2 = kx + kitchenW;
    const bw2 = W - livingW - kitchenW;
    walls += `<path class="fp-wall-in" d="M${r(bx2)} ${by}V${by + BOTTOM_H}"/>`;
    doors += doorAt(bx2 + bw2 - DOOR - 6, by, 1);
    windows += windowV(X0 + W, by + 30, BOTTOM_H - 60);
  } else {
    windows += windowV(X0 + W, by + 20, BOTTOM_H - 40);
  }
  // Sliding doors onto the balconies.
  for (const b of rooms.filter((t) => t.kind === "balcony")) {
    const yb = Y0 + H;
    doors += `<rect class="fp-gap" x="${r(b.x + b.w * 0.2)}" y="${yb - 3}" width="${r(b.w * 0.6)}" height="6"/>
      <path class="fp-slide" d="M${r(b.x + b.w * 0.2)} ${yb - 1}h${r(b.w * 0.34)}M${r(b.x + b.w * 0.46)} ${yb + 1}h${r(b.w * 0.34)}"/>`;
  }

  return `
    <svg class="floor-plan${interactive ? " is-interactive" : ""}" viewBox="0 0 400 ${height}" role="group" aria-label="Evinizin kuşbakışı krokisi${caption ? `: ${caption}` : ""}">
      <defs>
        <pattern id="fp-wood" width="48" height="14" patternUnits="userSpaceOnUse"><path d="M0 7H48M0 14H48M16 0V7M40 7V14"/></pattern>
        <pattern id="fp-tile" width="11" height="11" patternUnits="userSpaceOnUse"><path d="M11 0V11H0"/></pattern>
        <pattern id="fp-deck" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M8 0V8"/></pattern>
        <pattern id="fp-hall" width="18" height="18" patternUnits="userSpaceOnUse"><path d="M0 0L18 18M18 0L0 18"/></pattern>
      </defs>
      <rect class="fp-shadow" x="${X0 + 3}" y="${Y0 + 5}" width="${W}" height="${H}" rx="3"/>
      ${roomsHtml}
      <g class="fp-lines">
        <rect class="fp-wall" x="${X0}" y="${Y0}" width="${W}" height="${H}"/>
        ${walls}
        ${windows}
        ${doors}
        <path class="fp-entry" d="M${X0 + 8} ${r(hy + HALL_H / 2)}h14m-5 -5 5 5-5 5"/>
        <text class="fp-entry-label" x="${X0 + 26}" y="${r(hy + HALL_H / 2 + 4)}">Giriş</text>
      </g>
      <g class="fp-emblems" data-emblems></g>
    </svg>`;
}

// Emblem icons by product category (24×24, drawn with strokes).
const CATEGORY_ICONS = {
  "Merkez ve ekran": '<rect x="4" y="5" width="16" height="11" rx="2"/><path d="M9 20h6M12 16v4"/>',
  Aydınlatma: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2v.1h5v-.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z"/>',
  "Priz ve anahtarlar": '<path d="M9 3v5M15 3v5"/><path d="M6 8h12v3a6 6 0 0 1-12 0V8Z"/><path d="M12 17v4"/>',
  Sensörler: '<circle cx="12" cy="12" r="2"/><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8"/>',
  Isıtma: '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0Z"/><path d="M12 9v7"/>',
  Güvenlik: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z"/>',
  "Perde ve panjur": '<path d="M4 4h16M6 4v15M18 4v15M6 9h12M6 14h12"/>',
  "Su ve bahçe": '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11Z"/>',
};
const FALLBACK_ICON = '<circle cx="12" cy="12" r="6"/>';

/** Icon markup (inner SVG, 24×24 viewBox) for a product category. */
export function categoryIcon(category) {
  return CATEGORY_ICONS[category] || FALLBACK_ICON;
}

const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

/**
 * Emblems for the products placed in each room.
 * placements: { roomId: { productId: qty } }; lookup(id) → { name, category }.
 * Returns the markup for <g data-emblems> and the ids of rooms that have products.
 * `size` is the emblem diameter in plan units (bigger on phones, for fingers).
 */
export function emblemsSvg({ bedrooms, balconies = 0 }, placements, lookup, { size = EMBLEM } = {}) {
  const { rooms } = planLayout(bedrooms, balconies);
  const STEP = size + 3;
  const icon = size * 0.6;
  const pad = (size - icon) / 2;
  const half = size / 2;
  let html = "";
  const filled = [];
  for (const room of rooms) {
    const entries = Object.entries(placements?.[room.id] || {}).filter(([id, q]) => q > 0 && lookup(id));
    if (!entries.length) continue;
    filled.push(room.id);
    const { x, y, w, h } = room.area;
    const cols = Math.max(1, Math.floor((w + STEP - size) / STEP));
    const rows = Math.max(1, Math.floor((h + STEP - size) / STEP));
    const capacity = cols * rows;
    const shown = entries.length > capacity ? entries.slice(0, capacity - 1) : entries;
    const slot = (i) => [x + (i % cols) * STEP, y + Math.floor(i / cols) * STEP];
    shown.forEach(([id, qty], i) => {
      const item = lookup(id);
      const [ex, ey] = slot(i);
      html += `
        <g class="fp-emblem" transform="translate(${r(ex)} ${r(ey)})" data-room="${room.id}" data-product="${esc(id)}" tabindex="0" role="button" aria-label="${esc(item.name)}: ne işe yarar?">
          <title>${qty} × ${esc(item.name)} (${esc(room.label)})</title>
          <circle cx="${half}" cy="${half}" r="${half}"/>
          <svg x="${r(pad)}" y="${r(pad)}" width="${r(icon)}" height="${r(icon)}" viewBox="0 0 24 24" class="fp-emblem-icon">${categoryIcon(item.category)}</svg>
          ${qty > 1 ? `<circle class="fp-badge" cx="${size - 1}" cy="2" r="${r(size * 0.3)}"/><text class="fp-badge-text" x="${size - 1}" y="${r(2 + size * 0.15)}">${qty > 9 ? "9+" : qty}</text>` : ""}
        </g>`;
    });
    if (entries.length > shown.length) {
      const [ex, ey] = slot(shown.length);
      html += `<g class="fp-emblem fp-more" transform="translate(${r(ex)} ${r(ey)})" data-room="${room.id}">
          <title>${entries.length - shown.length} ürün daha (${esc(room.label)})</title>
          <circle cx="${half}" cy="${half}" r="${half}"/><text x="${half}" y="${r(half + size * 0.2)}">+${entries.length - shown.length}</text></g>`;
    }
  }
  return { html, filled };
}
