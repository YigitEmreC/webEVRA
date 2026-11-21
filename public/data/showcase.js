// ─────────────────────────────────────────────────────────────────────────────
//  ANA SAYFA VİTRİNİ (assets/js/showcase.js)
//  • houseSpots: etkileşimli ev görselindeki (assets/img/maketev.webp) noktalar. `id` catalog.js'teki ürün;
//    ad, açıklama ve "Neler yapabilir?" oradan gelir. x / y: çizimdeki yer, %.
//  • brands: kayan marka şeridi. Bu markalar Evra'nın ortağı değildir; cihazları
//    Wi-Fi, Bluetooth, Zigbee, kızılötesi (IR) ya da Home Assistant
//    entegrasyonlarıyla sisteme bağlanabilir. Uyumluluğu keşifte kontrol ediyoruz.
//  • tablet: sitedeki duvar ekranı demosu (sahneler, oda listeleri, son olaylar,
//    perdeler ve enerji sekmeleri).
//  • day: "Evra'lı bir gün" kartları. `image` eklerseniz (örn.
//    "/assets/img/day/sabah.jpg") renkli arka planın yerine fotoğraf gösterilir.
// ─────────────────────────────────────────────────────────────────────────────

export const houseSpots = [
  { id: "relay", x: 6.4, y: 42 },
  { id: "smoke-sensor", x: 16.2, y: 28.3 },
  { id: "gas-detector", x: 15, y: 50.7 },
  { id: "smart-plug", x: 22.6, y: 44.6 },
  { id: "irrigation", x: 10.7, y: 61.5 },
  { id: "flood-sensor", x: 42.9, y: 46 },
  { id: "presence-sensor", x: 52.8, y: 24.9 },
  { id: "indoor-camera", x: 55, y: 47.7 },
  { id: "light-strip", x: 60.3, y: 67.3 },
  { id: "hub", x: 67.2, y: 66.3 },
  { id: "wall-panel", x: 70.5, y: 51.8 },
  { id: "climate-sensor", x: 73.1, y: 29.7 },
  { id: "colour-bulb", x: 78.4, y: 35.5 },
  { id: "curtain-motor", x: 87.5, y: 22.8 },
  { id: "radiator-valve", x: 94.4, y: 53.2 },
  { id: "door-sensor", x: 29.8, y: 78 },
];

export const protocols = ["Wi-Fi", "Bluetooth", "Zigbee", "Kızılötesi (IR)", "Matter"];

export const brands = [
  ["Samsung", "LG", "Arçelik", "Beko", "Vestel", "Bosch", "Siemens", "Philips Hue", "IKEA", "Xiaomi", "Aqara", "Sonoff", "Shelly", "TP-Link Tapo"],
  ["Google Home", "Amazon Alexa", "Apple Home", "Sonos", "Spotify", "Chromecast", "Apple TV", "Sony", "Daikin", "Mitsubishi Electric", "Netatmo", "Yale", "Nuki", "Reolink", "Roborock", "Tuya"],
];

export const tablet = {
  scenes: [
    {
      id: "morning",
      name: "Günaydın",
      icon: '<path d="M12 3v2M5.6 5.6l1.4 1.4M3 12h2M18.4 5.6 17 7M21 12h-2M7 17a5 5 0 0 1 10 0"/><path d="M3 20h18"/>',
      text: "Perdeler açılır, ışıklar yumuşak yanar, kombi evi ısıtır.",
      status: { lights: ["Yumuşak", "4 / 9 açık"], climate: ["Isıtılıyor", "22° · 3 oda"], security: ["Kapalı", "Kapı kilitli"], cameras: ["Bekliyor", "Kayıt kapalı"], shades: ["Açık", "4 / 4 açık"], energy: ["Normal", "1,2 kW"] },
    },
    {
      id: "away",
      name: "Evden çıkış",
      icon: '<path d="M10 17l5-5-5-5M15 12H3"/><path d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>',
      text: "Bütün ışıklar söner, kapı kilitlenir, alarm kurulur, kombi kısılır.",
      status: { lights: ["Kapalı", "0 / 9 açık"], climate: ["Tasarruf", "17° · 3 oda"], security: ["Kurulu", "2 / 2 kilitli"], cameras: ["Canlı", "3 kayıtta"], shades: ["Kapalı", "0 / 4 açık"], energy: ["Düşük", "0,3 kW"] },
    },
    {
      id: "movie",
      name: "Film",
      icon: '<rect x="3" y="5" width="18" height="12" rx="2"/><path d="M8 21h8M12 17v4"/>',
      text: "Perdeler kapanır, salon %20'ye kısılır, TV arkası LED yanar.",
      status: { lights: ["Loş", "2 / 9 açık"], climate: ["Konfor", "22° · 3 oda"], security: ["Kapalı", "Kapı kilitli"], cameras: ["Bekliyor", "Kayıt kapalı"], shades: ["Kapalı", "0 / 4 açık"], energy: ["Normal", "0,9 kW"] },
    },
    {
      id: "sleep",
      name: "İyi geceler",
      icon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5Z"/>',
      text: "Işıklar söner, kapı kilitlenir, yatak odası 19°'ye ayarlanır.",
      status: { lights: ["Kapalı", "0 / 9 açık"], climate: ["Uyku", "19° · 3 oda"], security: ["Gece", "2 / 2 kilitli"], cameras: ["Dışarısı", "2 kayıtta"], shades: ["Kapalı", "0 / 4 açık"], energy: ["Düşük", "0,4 kW"] },
    },
    {
      id: "home",
      name: "Eve dönüş",
      icon: '<path d="M3 11 12 4l9 7v9H3v-9Z"/><path d="M10 20v-5h4v5"/>',
      text: "Kapı açılır, hol ve salon yanar, alarm kapanır, ev ısınmaya başlar.",
      status: { lights: ["Hoş geldiniz", "4 / 9 açık"], climate: ["Isıtılıyor", "21° · 3 oda"], security: ["Kapalı", "Kapı açık"], cameras: ["Sessiz", "Bildirim kapalı"], shades: ["Yarım", "2 / 4 açık"], energy: ["Normal", "1,1 kW"] },
    },
    {
      id: "vacation",
      name: "Tatil",
      icon: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
      text: "Alarm kurulur, kombi en aza iner; akşamları ışıklar yanıp söner, ev dolu görünür.",
      status: { lights: ["Simülasyon", "Akşam rastgele"], climate: ["Donma koruma", "12° · 3 oda"], security: ["Kurulu", "2 / 2 kilitli"], cameras: ["Canlı", "3 kayıtta"], shades: ["Programlı", "Sabah açılır"], energy: ["Çok düşük", "0,1 kW"] },
    },
  ],
  // "Son olaylar" on the home screen (newest first)
  events: [
    { time: "21:04", text: "Film sahnesi açıldı", icon: "scene" },
    { time: "20:41", text: "Çamaşır makinesi bitti", icon: "bell" },
    { time: "19:12", text: "Giriş kapısı kilitlendi", icon: "lock" },
    { time: "18:30", text: "Güneş battı, perdeler kapandı", icon: "shades" },
  ],
  // Perdeler tab (open %: 0 = closed)
  shades: [
    { name: "Salon", open: 0 },
    { name: "Yatak odası", open: 0 },
    { name: "Çocuk odası", open: 0 },
    { name: "Mutfak", open: 0 },
  ],
  // Enerji tab: use per hour of the day (kWh, 00:00 → 23:00; shown as the last
  // 24 hours) and the devices on the meter
  energy: {
    hours: [0.3, 0.2, 0.2, 0.2, 0.3, 0.6, 1.1, 1.4, 0.9, 0.5, 0.4, 0.5, 0.7, 0.6, 0.5, 0.6, 0.8, 1.2, 1.5, 1.7, 1.3, 0.9, 0.6, 0.4],
    devices: [
      { name: "Kombi", watt: 180, on: true },
      { name: "Çamaşır makinesi", watt: 0, on: false },
      { name: "TV ve ses sistemi", watt: 140, on: true },
      { name: "Bulaşık makinesi", watt: 0, on: false },
      { name: "Buzdolabı", watt: 90, on: true, fixed: true },
    ],
  },
  rooms: [
    { name: "Salon", lights: 3, temp: 22 },
    { name: "Mutfak", lights: 2, temp: 21 },
    { name: "Yatak odası", lights: 2, temp: 20 },
    { name: "Çocuk odası", lights: 1, temp: 21 },
    { name: "Hol", lights: 1, temp: 20 },
  ],
};

export const day = [
  {
    time: "07:00",
    label: "Uyanış",
    title: "Ev sizinle uyanır",
    text: "Perdeler güneşle açılır, kombi evi çoktan ısıtmıştır, mutfağa girince ışıklar yumuşakça yanar.",
    tags: ["Perde", "Isıtma", "Aydınlatma"],
    theme: "dawn",
  },
  {
    time: "12:00",
    label: "Evde kimse yok",
    title: "Kimse yokken boşa bir şey yanmaz",
    text: "Herkes çıkınca kombi kısılır, unutulan ışıklar söner, kapı kendini kilitler.",
    tags: ["Isıtma", "Aydınlatma", "Akıllı kilit"],
    theme: "noon",
  },
  {
    time: "17:30",
    label: "Eve dönüş",
    title: "Kapı siz gelmeden açılır",
    text: "Eve yaklaşınca ev ısınmaya başlar, kapı önü ışığı yanar, kamera bildirimleri sessize alınır.",
    tags: ["Akıllı kilit", "Kamera", "Dış ışık"],
    theme: "dusk",
  },
  {
    time: "19:00",
    label: "Akşam",
    title: "Sıcak bir akşam ışığı",
    text: "Güneş batınca salon sıcak renge geçer, perdeler kapanır; çamaşır bitince telefonunuza haber gelir.",
    tags: ["Aydınlatma", "Perde", "Bildirim"],
    theme: "evening",
  },
  {
    time: "21:00",
    label: "Film gecesi",
    title: "Oynat'a basın, oda hazırlansın",
    text: "Işıklar kısılır, perdeler kapanır, TV ve klima tek dokunuşla açılır. Filmi durdurun, salon geri gelir.",
    tags: ["TV ve klima (IR)", "Aydınlatma", "Perde"],
    theme: "movie",
  },
  {
    time: "23:00",
    label: "İyi geceler",
    title: "Günü tek dokunuşla kapatın",
    text: "Bütün ışıklar söner, kapı kilitlenir, kombi uyku moduna geçer. Gece kalkınca koridor hafifçe aydınlanır.",
    tags: ["Aydınlatma", "Akıllı kilit", "Isıtma", "Hareket sensörü"],
    theme: "night",
  },
  {
    time: "+",
    label: "Ve daha fazlası",
    title: "Bağlanan her şey sisteme katılır",
    text: "2.000'den fazla entegrasyonla evinizdeki cihazlar aynı sisteme bağlanır.",
    tags: ["Robot süpürge", "Sulama", "Garaj kapısı", "Hava kalitesi", "Su vanası", "Beyaz eşya", "Hoparlör"],
    theme: "more",
  },
];

// "Oda oda akıllı ev" slider (assets/js/showcase.js → initRooms).
// devices: catalog.js ürün id'si; x / y: o odanın çizimindeki yeri (%).
// auto: o odaya özel kısa otomasyon örneği.
export const roomTour = [
  {
    id: "salon",
    name: "Salon",
    tagline: "Film modu tek dokunuşla",
    devices: [
      { id: "wall-panel", x: 34, y: 34, auto: "Tek dokunuşla \"Film\": ışıklar kısılır, perdeler kapanır" },
      { id: "colour-bulb", x: 41.5, y: 21, auto: "Akşam olunca sıcak renge geçer" },
      { id: "light-strip", x: 15, y: 37, auto: "TV açılınca arkası yanar" },
      { id: "curtain-motor", x: 82.5, y: 12, auto: "Güneş batınca perdeler kapanır" },
      { id: "indoor-camera", x: 66, y: 30, auto: "Evde kimse yokken hareket olursa kayıt" },
    ],
  },
  {
    id: "mutfak",
    name: "Mutfak",
    tagline: "Kaçakta ilk siz bilin",
    devices: [
      { id: "smoke-sensor", x: 33, y: 5, auto: "Duman olunca öter, ışıklar yanar, size haber gelir" },
      { id: "gas-detector", x: 10, y: 50, auto: "Gaz kaçağında kombi kapanır" },
      { id: "relay", x: 72.5, y: 27, auto: "Eve dönerken yoldan kombiyi açın" },
      { id: "smart-plug", x: 55, y: 53, auto: "Kahve makinesi sabah 7'de hazır" },
      { id: "flood-sensor", x: 50, y: 90, auto: "Evye altı sızdırırsa ana vana kapanır" },
    ],
  },
  {
    id: "yatak",
    name: "Yatak odası",
    tagline: "Güne yavaşça uyanın",
    devices: [
      { id: "curtain-motor", x: 12.5, y: 12, auto: "Sabah perdeler yavaşça açılır" },
      { id: "radiator-valve", x: 20, y: 61, auto: "Oda sadece geceleri ısınır" },
      { id: "colour-bulb", x: 80.5, y: 46, auto: "Uyku saatinde ışık loşlaşır" },
      { id: "climate-sensor", x: 88, y: 30, auto: "Oda soğuyunca ısıtma açılır" },
      { id: "night-light", x: 80, y: 80, auto: "Gece kalkınca yol aydınlanır" },
    ],
  },
  {
    id: "banyo",
    name: "Banyo",
    tagline: "Su kaçağı ve hareketsizlik takibi",
    devices: [
      { id: "flood-sensor", x: 40, y: 90, auto: "Yere su gelince anında bildirim" },
      { id: "presence-sensor", x: 50, y: 5, auto: "Uzun süre hareketsizlikte yakınlara haber" },
      { id: "panic-button", x: 90, y: 50, auto: "Tek basışla yardım çağırın" },
      { id: "colour-bulb", x: 22, y: 16, auto: "Gece banyoya girince hafif ışık" },
    ],
  },
  {
    id: "cocuk",
    name: "Çocuk odası",
    tagline: "Bebek uyurken siz rahat",
    devices: [
      { id: "indoor-camera", x: 18, y: 30, auto: "Bebek ağlayınca telefonunuza bildirim" },
      { id: "climate-sensor", x: 86.5, y: 57, auto: "Oda çok ısınırsa uyarı" },
      { id: "night-light", x: 15, y: 78, auto: "Gece beslenmesi için yumuşak ışık" },
      { id: "door-sensor", x: 91, y: 30, auto: "Pencere açılınca uyarı" },
    ],
  },
  {
    id: "giris",
    name: "Giriş",
    tagline: "Kapı sizi tanır",
    devices: [
      { id: "smart-lock", x: 56, y: 53, auto: "Siz yaklaşınca kapı açılır, çıkınca kilitlenir" },
      { id: "door-sensor", x: 58.5, y: 19, auto: "Gece kapı açılırsa alarm" },
      { id: "motion-sensor", x: 93, y: 6, auto: "Girişte ışık kendiliğinden yanar" },
      { id: "siren", x: 25, y: 25, auto: "İzinsiz girişte siren çalar" },
      { id: "hub", x: 73, y: 56, auto: "Bütün evi tek sistemde toplar" },
    ],
  },
  {
    id: "balkon",
    name: "Balkon ve bahçe",
    tagline: "Bahçe kendini sular",
    devices: [
      { id: "outdoor-camera", x: 10, y: 12, auto: "Kapıya biri gelince bildirim" },
      { id: "irrigation", x: 72, y: 78, auto: "Her sabah sulama; yağmur yağdıysa atlanır" },
      { id: "light-strip", x: 50, y: 55, auto: "Akşam balkon ışıkları yanar" },
    ],
  },
];
