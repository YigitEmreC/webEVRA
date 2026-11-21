// Illustrated rooms for the "Oda oda akıllı ev" slider (showcase.js → initRooms).
// Each scene is 600 × 360; the smart devices are not drawn here: they sit on top
// as coloured markers (positions in public/data/showcase.js → roomTour).

const W = 600;
const H = 360;

function room({ wall, wall2, floor, floorPattern }) {
  return `
    <rect width="${W}" height="270" fill="url(#rs-wall)"/>
    <defs>
      <linearGradient id="rs-wall" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${wall}"/><stop offset="1" stop-color="${wall2}"/></linearGradient>
      <pattern id="rs-planks" width="80" height="18" patternUnits="userSpaceOnUse"><rect width="80" height="18" fill="${floor}"/><path d="M0 18H80M30 0v18" stroke="#00000022" stroke-width="1.5"/></pattern>
      <pattern id="rs-tiles" width="30" height="30" patternUnits="userSpaceOnUse"><rect width="30" height="30" fill="${floor}"/><path d="M30 0V30H0" fill="none" stroke="#00000018" stroke-width="1.5"/></pattern>
      <pattern id="rs-walltiles" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0V24H0" fill="none" stroke="#ffffff88" stroke-width="1.5"/></pattern>
      <radialGradient id="rs-glow"><stop offset="0" stop-color="#ffe2a8" stop-opacity=".85"/><stop offset="1" stop-color="#ffe2a8" stop-opacity="0"/></radialGradient>
      <linearGradient id="rs-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7cc4f5"/><stop offset="1" stop-color="#d9f0ff"/></linearGradient>
      <linearGradient id="rs-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f7a46b"/><stop offset="1" stop-color="#f7d79b"/></linearGradient>
    </defs>
    <rect y="270" width="${W}" height="90" fill="url(#${floorPattern})"/>
    <defs>
      <linearGradient id="rs-floorshade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".22"/><stop offset=".5" stop-color="#000" stop-opacity="0"/></linearGradient>
      <linearGradient id="rs-ceil" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".12"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
      <radialGradient id="rs-vignette" cx="50%" cy="45%" r="75%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient>
    </defs>
    <rect y="270" width="${W}" height="90" fill="url(#rs-floorshade)"/>
    <rect width="${W}" height="40" fill="url(#rs-ceil)"/>
    <path d="M0 0 34 20v244L0 270Z" fill="#000" opacity=".07"/><path d="M${W} 0l-34 20v244l34 6Z" fill="#000" opacity=".07"/>
    <path d="M34 264 0 270M${W - 34} 264l34 6" stroke="#fff" stroke-width="2" opacity=".5"/>
    <rect y="264" width="${W}" height="8" fill="#ffffff" opacity=".7"/>`;
}

const plant = (x, y, s = 1) => `
  <g transform="translate(${x} ${y}) scale(${s})">
    <path d="M-14 0h28l-4 26h-20Z" fill="#e07a5f"/>
    <ellipse cx="0" cy="-14" rx="16" ry="22" fill="#4f9d69"/><ellipse cx="-14" cy="-6" rx="10" ry="16" fill="#5fb37a" transform="rotate(-30 -14 -6)"/><ellipse cx="14" cy="-6" rx="10" ry="16" fill="#3f8a59" transform="rotate(30 14 -6)"/>
  </g>`;

const windowAt = (x, y, w, h, sky = "rs-sky", curtains = "#c9a6d9") => `
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="url(#${sky})"/>
  <circle cx="${x + w * 0.72}" cy="${y + h * 0.3}" r="${Math.min(w, h) * 0.12}" fill="#fff6c9"/>
  <path d="M${x + w / 2} ${y}v${h}M${x} ${y + h / 2}h${w}" stroke="#ffffff" stroke-width="5"/>
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="none" stroke="#ffffff" stroke-width="6"/>
  <rect x="${x - 14}" y="${y - 10}" width="${w + 28}" height="7" rx="3" fill="#6b7280"/>
  <path d="M${x - 12} ${y - 3}h22l-6 ${h + 26}h-16Z" fill="${curtains}"/><path d="M${x + w + 12} ${y - 3}h-22l6 ${h + 26}h16Z" fill="${curtains}"/>`;

const SCENES = {
  salon: () => `
    ${room({ wall: "#efe6ff", wall2: "#ddd0ff", floor: "#d6a77a", floorPattern: "rs-planks" })}
    ${windowAt(430, 56, 130, 134, "rs-dusk", "#f2a7c3")}
    <rect x="34" y="138" width="112" height="70" rx="6" fill="#1b2240"/><rect x="40" y="144" width="100" height="58" rx="3" fill="#3557b7"/>
    <rect x="30" y="134" width="120" height="78" rx="8" fill="none" stroke="#9ed5fd" stroke-width="4" opacity=".8"/>
    <rect x="26" y="222" width="132" height="44" rx="6" fill="#8a5a3c"/><rect x="34" y="232" width="52" height="24" rx="3" fill="#a87250"/><rect x="96" y="232" width="52" height="24" rx="3" fill="#a87250"/>
    <rect x="196" y="110" width="20" height="30" rx="4" fill="#1b2240"/><rect x="199" y="114" width="14" height="20" rx="2" fill="#4fd1bd"/>
    <path d="M250 0v52" stroke="#6b7280" stroke-width="2"/><path d="M232 52h36l-8 16h-20Z" fill="#f5b544"/><circle cx="250" cy="96" r="70" fill="url(#rs-glow)"/>
    <rect x="356" y="118" width="84" height="7" rx="3" fill="#8a5a3c"/><rect x="368" y="96" width="14" height="22" rx="3" fill="#ffffff"/><rect x="398" y="100" width="22" height="18" rx="3" fill="#9aafdd"/>
    <ellipse cx="270" cy="322" rx="190" ry="26" fill="#f2a7c3" opacity=".55"/>
    <ellipse cx="280" cy="270" rx="140" ry="9" fill="#000" opacity=".18"/><ellipse cx="92" cy="268" rx="70" ry="6" fill="#000" opacity=".16"/>
    <rect x="160" y="196" width="240" height="70" rx="18" fill="#2f9e8f"/><rect x="172" y="176" width="216" height="44" rx="16" fill="#3bb5a4"/><rect x="146" y="200" width="30" height="66" rx="12" fill="#2a8a7c"/><rect x="384" y="200" width="30" height="66" rx="12" fill="#2a8a7c"/>
    <rect x="190" y="186" width="48" height="34" rx="10" fill="#f5b544"/><rect x="322" y="186" width="48" height="34" rx="10" fill="#e0614f"/>
    <ellipse cx="280" cy="300" rx="80" ry="14" fill="#8a5a3c"/>
    ${plant(565, 266, 1.3)}`,

  mutfak: () => `
    ${room({ wall: "#fff3e0", wall2: "#ffe2b8", floor: "#e9e2d8", floorPattern: "rs-tiles" })}
    <rect x="30" y="54" width="220" height="80" rx="6" fill="#ffffff" stroke="#e5c9a3" stroke-width="3"/><path d="M103 54v80M176 54v80" stroke="#e5c9a3" stroke-width="3"/>
    ${windowAt(272, 60, 112, 96, "rs-sky", "#9ed5fd")}
    <rect x="420" y="72" width="34" height="58" rx="5" fill="#ffffff" stroke="#c4b6a2" stroke-width="2"/><rect x="427" y="82" width="20" height="9" rx="2" fill="#4fd1bd"/>
    <rect x="470" y="70" width="104" height="196" rx="10" fill="#dfe5ee"/><path d="M470 150h104" stroke="#c3ccd8" stroke-width="3"/><rect x="556" y="96" width="5" height="34" rx="2" fill="#9aa4b6"/><rect x="556" y="170" width="5" height="40" rx="2" fill="#9aa4b6"/>
    <ellipse cx="240" cy="270" rx="220" ry="8" fill="#000" opacity=".16"/><ellipse cx="522" cy="268" rx="56" ry="6" fill="#000" opacity=".16"/>
    <rect x="30" y="206" width="420" height="60" rx="4" fill="#f4a261"/><rect x="24" y="198" width="432" height="12" rx="4" fill="#ffffff"/>
    <rect x="70" y="190" width="90" height="8" rx="2" fill="#2b2d42"/><circle cx="92" cy="194" r="6" fill="#e0614f" opacity=".8"/><circle cx="138" cy="194" r="6" fill="#2b2d42" stroke="#555" stroke-width="2"/>
    <rect x="280" y="194" width="70" height="6" rx="3" fill="#c3ccd8"/><path d="M300 194v-24h16" stroke="#9aa4b6" stroke-width="4" fill="none"/>
    <rect x="316" y="166" width="30" height="32" rx="6" fill="#2b2d42"/><rect x="322" y="174" width="18" height="10" rx="2" fill="#f5b544"/>
    <path d="M60 220h70M170 220h70M280 220h70M390 220h40" stroke="#e08a45" stroke-width="3"/>
    <path d="M200 0v40" stroke="#6b7280" stroke-width="2"/><circle cx="200" cy="52" r="12" fill="#f5b544"/><circle cx="200" cy="90" r="60" fill="url(#rs-glow)"/>
    ${plant(250, 196, 0.6)}`,

  yatak: () => `
    ${room({ wall: "#e4efff", wall2: "#cfe0ff", floor: "#c99a6b", floorPattern: "rs-planks" })}
    ${windowAt(30, 54, 92, 118, "rs-dusk", "#9aafdd")}
    <rect x="34" y="200" width="84" height="44" rx="6" fill="#ffffff" stroke="#c4cbd9" stroke-width="2"/><path d="M50 202v40M66 202v40M82 202v40M98 202v40" stroke="#d7dce8" stroke-width="3"/>
    <rect x="230" y="70" width="140" height="70" rx="6" fill="#ffffff"/><rect x="238" y="78" width="124" height="54" rx="3" fill="#f2a7c3"/><circle cx="270" cy="104" r="14" fill="#f5b544"/><path d="M238 132l40-26 30 18 26-14 28 22Z" fill="#4f9d69"/>
    <ellipse cx="300" cy="275" rx="170" ry="10" fill="#000" opacity=".18"/>
    <rect x="160" y="150" width="280" height="60" rx="14" fill="#6b5ca5"/>
    <rect x="150" y="200" width="300" height="70" rx="12" fill="#ffffff"/><rect x="150" y="226" width="300" height="56" rx="10" fill="#9aafdd"/><path d="M150 236h300" stroke="#7f96cc" stroke-width="4"/>
    <rect x="178" y="186" width="80" height="28" rx="10" fill="#eef2fb"/><rect x="342" y="186" width="80" height="28" rx="10" fill="#eef2fb"/>
    <rect x="455" y="214" width="56" height="52" rx="6" fill="#8a5a3c"/><path d="M473 214v-34h20v34" fill="#f5b544"/><path d="M466 180h34l-6-22h-22Z" fill="#ffd27a"/><circle cx="483" cy="182" r="54" fill="url(#rs-glow)"/>
    <rect x="96" y="214" width="50" height="52" rx="6" fill="#8a5a3c"/>
    <rect x="514" y="96" width="34" height="40" rx="5" fill="#ffffff" stroke="#c4cbd9" stroke-width="2"/><text x="531" y="121" font-size="11" font-weight="700" text-anchor="middle" fill="#3d5ba9">21°</text>`,

  banyo: () => `
    ${room({ wall: "#e3f7f4", wall2: "#c8eee8", floor: "#dfe7ea", floorPattern: "rs-tiles" })}
    <rect width="${W}" height="270" fill="url(#rs-walltiles)"/>
    <rect x="80" y="62" width="104" height="110" rx="50" fill="#d6f0fb" stroke="#9fc9d9" stroke-width="4"/><path d="M110 92l20-14M120 110l34-22" stroke="#ffffff" stroke-width="5" stroke-linecap="round"/>
    <rect x="60" y="196" width="148" height="70" rx="8" fill="#ffffff" stroke="#b6d4dc" stroke-width="2"/><rect x="86" y="186" width="96" height="14" rx="6" fill="#ffffff" stroke="#b6d4dc" stroke-width="2"/><path d="M134 186v-14h12" stroke="#9aa4b6" stroke-width="4" fill="none"/>
    <path d="M226 200h44v40c0 16-8 26-22 26s-22-10-22-26Z" fill="#ffffff" stroke="#b6d4dc" stroke-width="2"/><rect x="230" y="176" width="36" height="24" rx="5" fill="#ffffff" stroke="#b6d4dc" stroke-width="2"/>
    <ellipse cx="430" cy="270" rx="140" ry="8" fill="#000" opacity=".14"/><ellipse cx="134" cy="268" rx="80" ry="6" fill="#000" opacity=".12"/>
    <path d="M300 206h262v34a26 26 0 0 1-26 26H326a26 26 0 0 1-26-26Z" fill="#ffffff" stroke="#b6d4dc" stroke-width="3"/><rect x="312" y="212" width="238" height="14" rx="7" fill="#9ed5fd"/>
    <path d="M520 206v-110h22" stroke="#9aa4b6" stroke-width="5" fill="none"/><circle cx="544" cy="96" r="10" fill="#9aa4b6"/>
    <rect x="460" y="118" width="40" height="70" rx="6" fill="#f2a7c3"/><path d="M460 130h40" stroke="#e58fb0" stroke-width="3"/>
    ${plant(580, 266, 0.9)}`,

  cocuk: () => `
    ${room({ wall: "#fff0f6", wall2: "#ffd9e8", floor: "#e8c39e", floorPattern: "rs-planks" })}
    ${windowAt(440, 54, 112, 116, "rs-sky", "#9ed5fd")}
    <rect x="70" y="118" width="84" height="7" rx="3" fill="#8a5a3c"/><rect x="78" y="96" width="24" height="22" rx="4" fill="#f5b544"/><rect x="128" y="102" width="18" height="16" rx="3" fill="#4fd1bd"/>
    <path d="M300 0v40" stroke="#6b7280" stroke-width="2"/><path d="M262 40h76" stroke="#6b7280" stroke-width="3"/><circle cx="268" cy="62" r="9" fill="#f5b544"/><path d="M300 52l6 12-13 0Z" fill="#e0614f"/><circle cx="332" cy="62" r="9" fill="#4fd1bd"/>
    <path d="M300 40v12M268 40v13M332 40v13" stroke="#6b7280" stroke-width="1.5"/>
    <ellipse cx="300" cy="274" rx="115" ry="8" fill="#000" opacity=".16"/><ellipse cx="508" cy="268" rx="54" ry="6" fill="#000" opacity=".14"/>
    <rect x="198" y="150" width="204" height="120" rx="10" fill="none" stroke="#ffffff" stroke-width="8"/><path d="M222 154v112M246 154v112M270 154v112M294 154v112M318 154v112M342 154v112M366 154v112" stroke="#ffffff" stroke-width="5"/>
    <rect x="204" y="222" width="192" height="40" rx="8" fill="#9ed5fd"/><rect x="210" y="212" width="60" height="18" rx="8" fill="#fff"/>
    <path d="M300 300l12 24 26 4-19 18 5 26-24-12-24 12 5-26-19-18 26-4Z" fill="#f5b544" opacity=".55" transform="translate(-20 -20) scale(.9)"/>
    <rect x="460" y="214" width="96" height="52" rx="8" fill="#7a5be0"/><rect x="470" y="202" width="20" height="20" rx="4" fill="#e0614f"/><circle cx="520" cy="210" r="12" fill="#2f9e5f"/>
    <rect x="512" y="186" width="30" height="34" rx="5" fill="#ffffff" stroke="#c4cbd9" stroke-width="2"/><text x="527" y="208" font-size="10" font-weight="700" text-anchor="middle" fill="#3d5ba9">22°</text>`,

  giris: () => `
    ${room({ wall: "#eef1f8", wall2: "#dbe2f0", floor: "#b9a48c", floorPattern: "rs-tiles" })}
    <rect x="224" y="40" width="132" height="230" rx="6" fill="#2b3245"/><rect x="236" y="54" width="108" height="90" rx="4" fill="#3d4660"/><rect x="236" y="156" width="108" height="100" rx="4" fill="#3d4660"/>
    <rect x="326" y="170" width="10" height="34" rx="4" fill="#d6dbe6"/>
    <path d="M200 40h180" stroke="#9aa4b6" stroke-width="6"/>
    <rect x="40" y="70" width="110" height="10" rx="4" fill="#8a5a3c"/><path d="M60 80v40M95 80v52M130 80v36" stroke="#8a5a3c" stroke-width="4"/><path d="M50 120h22l4 54H46Z" fill="#e0614f"/><path d="M84 132h24l4 60H80Z" fill="#3d6fd9"/>
    <rect x="132" y="78" width="36" height="24" rx="5" fill="#ffffff" stroke="#c4cbd9" stroke-width="2"/>
    <ellipse cx="290" cy="272" rx="80" ry="7" fill="#000" opacity=".18"/><ellipse cx="465" cy="268" rx="80" ry="6" fill="#000" opacity=".15"/>
    <rect x="390" y="214" width="150" height="52" rx="6" fill="#8a5a3c"/><path d="M465 214v52" stroke="#6e4630" stroke-width="3"/>
    <rect x="422" y="96" width="86" height="96" rx="43" fill="#d6f0fb" stroke="#c4cbd9" stroke-width="4"/>
    ${plant(520, 214, 0.8)}
    <ellipse cx="290" cy="320" rx="120" ry="18" fill="#3d6fd9" opacity=".35"/>`,

  balkon: () => `
    <defs><linearGradient id="rs-sky2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8fd0ff"/><stop offset="1" stop-color="#e6f6ff"/></linearGradient>
      <radialGradient id="rs-vignette" cx="50%" cy="45%" r="75%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".16"/></radialGradient>
      <pattern id="rs-deck" width="600" height="16" patternUnits="userSpaceOnUse"><rect width="600" height="16" fill="#c08a5c"/><path d="M0 16H600" stroke="#00000022" stroke-width="2"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="url(#rs-sky2)"/>
    <circle cx="500" cy="70" r="34" fill="#fff3b0"/>
    <ellipse cx="160" cy="226" rx="200" ry="70" fill="#7cc48f"/><ellipse cx="470" cy="236" rx="220" ry="64" fill="#5fb37a"/>
    <path d="M0 0h70v270H0Z" fill="#e9edf6"/><path d="M0 0h70v270H0Z" fill="none" stroke="#c7cfdf" stroke-width="3"/>
    <rect y="262" width="${W}" height="98" fill="url(#rs-deck)"/>
    <path d="M70 196h530" stroke="#ffffff" stroke-width="8"/><path d="M90 196v70M140 196v70M190 196v70M240 196v70M290 196v70M340 196v70M390 196v70M440 196v70M490 196v70M540 196v70M590 196v70" stroke="#ffffff" stroke-width="4"/>
    <path d="M70 192h530" stroke="#f5b544" stroke-width="3" opacity=".9"/>
    <rect x="148" y="214" width="74" height="56" rx="12" fill="#4f7fe0"/>
    <rect x="136" y="262" width="98" height="20" rx="8" fill="#3d6fd9"/>
    <path d="M146 282l-6 44M224 282l6 44M162 282v40M208 282v40" stroke="#2b3245" stroke-width="5" stroke-linecap="round"/>
    <rect x="160" y="226" width="50" height="22" rx="8" fill="#f5b544"/>
    <ellipse cx="300" cy="300" rx="44" ry="10" fill="#8a5a3c"/><path d="M300 300v40" stroke="#8a5a3c" stroke-width="5"/>
    ${plant(420, 290, 1.1)}${plant(470, 300, 0.9)}${plant(520, 292, 1.2)}
    <path d="M440 300c20-30 60-30 80 0" stroke="#8fd3ff" stroke-width="3" fill="none" stroke-dasharray="4 5"/>`,
};

/** SVG markup of a room scene. */
export function roomSceneSvg(id, label) {
  const draw = SCENES[id];
  if (!draw) return "";
  // Several scenes share one page: give every gradient/pattern id a room prefix.
  const markup = (draw() + `<rect width="${W}" height="${H}" fill="url(#rs-vignette)" pointer-events="none"/>`).replaceAll("rs-", `rs-${id}-`);
  return `<svg class="room-scene-art" viewBox="0 0 ${W} ${H}" role="img" aria-label="${label}">${markup}</svg>`;
}
