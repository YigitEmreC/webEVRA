// ─────────────────────────────────────────────────────────────────────────────
//  "KENDİ PAKETİNİ OLUŞTUR" (Paketler sayfasının üstü)
//  Adımlar: 1 Ev (oda + balkon) → 2 Isıtma → 3 Sorular (sistem ürün önerir)
//           → 4 Krokiniz (öneriler odalara yerleşir, oda oda değiştirilir) → 5 Özet
//  Fiyat hesabı settings.js → pricing bölümündedir.
//
//  • homeSizes: `rooms` = salon + yatak odaları, `bedrooms` = yatak odası sayısı.
//    `large: true` olan seçenek paket oluşturmaz; planlama formunu açar.
//  • systemItems: her pakette zorunlu ürünler (en az `min` adet).
//  • heatingKinds: ekranda gösterilen 4 ısıtma seçeneği. `floor` varsa
//    "Petek mi, yerden ısıtma mı?" diye ayrıca sorulur.
//  • heatingSystems: her ısıtma sisteminin eklediği ürünler.
//  • questions: "Sorular" adımı. Müşteri "Evet" derse `items` eklenir.
//    detail: soru altındaki "Nasıl çalışır?" maddeleri.
//  • roomProducts: oda düzenleyicide o oda için önce gösterilen ürünler.
//
//  Ürün satırlarında:
//    qty  : adet (her oda için), ya da "rooms" (salon + yatak odası sayısı kadar)
//    min  : en az kaç adet kalmalı (0 = çıkarılabilir)
//    room : ürünün krokide konduğu yer:
//           "hall" hol · "living" salon · "kitchen" mutfak · "bath1" banyo
//           "bed1" yatak odası · "kids" çocuk odası (Oda 2, yoksa yatak odası)
//           "bedrooms" her yatak odası · "rooms" salon + her yatak odası
//           "balconies" her balkon (balkon yoksa `fallback` odası)
//  Ürün id'leri catalog.js'teki ürünlerle aynı olmalı.
// ─────────────────────────────────────────────────────────────────────────────

export const CUSTOM_ID = "ozel";
export const CUSTOM_NAME = "Kendi Paketiniz";
export const MAX_BALCONIES = 4;

export const homeSizes = [
  { id: "1+1", label: "1+1", rooms: 2, bedrooms: 1 },
  { id: "2+1", label: "2+1", rooms: 3, bedrooms: 2 },
  { id: "3+1", label: "3+1", rooms: 4, bedrooms: 3 },
  { id: "4+1", label: "4+1", rooms: 5, bedrooms: 4 },
  { id: "5+1+", label: "5+1 ve üzeri", large: true },
];

export const systemItems = [
  { id: "hub", qty: 1, min: 1, room: "hall" },
  { id: "wall-panel", qty: 1, min: 1, room: "living" },
];

export const heatingKinds = [
  { id: "kombi", name: "Kombi", text: "Telefondan kombi kontrolü", floor: { petek: "kombi-petek", yerden: "kombi-yerden" } },
  { id: "merkezi", name: "Merkezi sistem", text: "Kalorifer, ortak kazan", floor: { petek: "merkezi-petek", yerden: "merkezi-yerden" } },
  { id: "klima", name: "Klima", text: "Klima ya da ısı pompası", system: "klima" },
  { id: "elektrikli", name: "Elektrikli ısıtıcı", text: "Soba, radyatör, ısıtıcı", system: "elektrikli" },
];

export const heatingSystems = [
  {
    id: "kombi-petek",
    name: "Kombi + petek",
    items: [
      { id: "relay", qty: 1, min: 1, room: "kitchen" },
      { id: "radiator-valve", qty: "rooms", min: 0, room: "rooms" },
    ],
  },
  {
    id: "kombi-yerden",
    name: "Kombi + yerden ısıtma",
    items: [
      { id: "relay", qty: 1, min: 1, room: "kitchen" },
      { id: "thermal-actuator", qty: "rooms", min: 1, room: "rooms" },
    ],
  },
  {
    id: "merkezi-petek",
    name: "Merkezi sistem + petek",
    items: [{ id: "radiator-valve", qty: "rooms", min: 1, room: "rooms" }],
  },
  {
    id: "merkezi-yerden",
    name: "Merkezi sistem + yerden ısıtma",
    items: [
      { id: "thermostat", qty: 1, min: 1, room: "living" },
      { id: "thermal-actuator", qty: "rooms", min: 1, room: "rooms" },
    ],
  },
  {
    id: "klima",
    name: "Klima",
    items: [{ id: "climate-sensor", qty: 1, min: 1, room: "living" }],
  },
  {
    id: "elektrikli",
    name: "Elektrikli ısıtıcı",
    items: [{ id: "smart-plug", qty: 1, min: 1, room: "living" }],
  },
  // Only offered when a ready package is used as the starting point.
  { id: "yok", name: "Isıtma ürünü yok", items: [] },
];

// Ready packages opened in the builder ("Bu paketi seç"): which rooms their
// products go to. Same room words as above; the first rooms come first.
export const templateRooms = {
  hub: ["hall"],
  "wall-panel": ["living"],
  "smoke-sensor": ["kitchen", "living"],
  "gas-detector": ["kitchen"],
  "flood-sensor": ["bath1", "kitchen"],
  "water-valve": ["kitchen"],
  "panic-button": ["bed1", "bath1", "living"],
  "presence-sensor": ["bath1", "bed1"],
  "night-light": ["kids", "bed1"],
  "indoor-camera": ["living", "kids"],
  "outdoor-camera": ["balconies", "hall"],
  "climate-sensor": ["kids", "living", "bed1"],
  "door-sensor": ["hall", "balconies", "living"],
  "motion-sensor": ["hall", "living"],
  "smart-plug": ["living", "kitchen"],
  "colour-bulb": ["rooms"],
  "light-strip": ["living"],
  relay: ["kitchen"],
  thermostat: ["living"],
  "radiator-valve": ["rooms"],
  "thermal-actuator": ["rooms"],
  "smart-lock": ["hall"],
  siren: ["hall"],
  "curtain-motor": ["living", "bed1"],
  irrigation: ["balconies", "living"],
};

export const questions = [
  {
    id: "safety",
    title: "Duman, gaz ve su kaçağında haber almak ister misiniz?",
    hint: "Önerilir: evde olmasanız da ilk siz bilirsiniz.",
    detail: ["Dedektör öttüğü anda telefonunuza bildirim gelir", "Gaz kaçağında kombi kapanır, su kaçağında ana vana kapatılabilir", "Pili azalınca sizi önceden uyarır"],
    items: [
      { id: "smoke-sensor", qty: 1, room: "kitchen" },
      { id: "gas-detector", qty: 1, room: "kitchen" },
      { id: "flood-sensor", qty: 1, room: "bath1" },
    ],
  },
  {
    id: "lights",
    title: "Işıklar kendiliğinden yanıp sönsün mü?",
    hint: "Akşam yanar, odaya girince yanar, çıkınca söner.",
    detail: ["Güneş batınca salon ışıkları kendiliğinden yanar", "Koridora girince ışık yanar, kimse kalmayınca söner", "Renk ve parlaklığı uygulamadan ayarlarsınız"],
    items: [
      { id: "colour-bulb", qty: 1, room: "rooms" },
      { id: "motion-sensor", qty: 1, room: "hall" },
      { id: "light-strip", qty: 1, room: "living" },
    ],
  },
  {
    id: "security",
    title: "Kamera ve hırsız alarmı ister misiniz?",
    hint: "Kapı açılınca bildirim, izinsiz girişte siren.",
    detail: ["Evde kimse yokken kapı açılırsa siren çalar, size haber gelir", "Kameralar hareket görünce kayıt alır; kayıtlar evde kalır", "Alarmı telefondan ya da duvar ekranından kurarsınız"],
    items: [
      { id: "indoor-camera", qty: 1, room: "living" },
      { id: "outdoor-camera", qty: 1, room: "balconies", fallback: "hall" },
      { id: "door-sensor", qty: 1, room: "hall" },
      { id: "siren", qty: 1, room: "hall" },
    ],
  },
  {
    id: "elderly",
    title: "Evde yaşlı ya da bakıma ihtiyacı olan biri var mı?",
    hint: "Acil yardım butonu ve hareketsizlik takibi.",
    detail: ["Acil butona basılınca yakınlarınıza anında haber gider", "Banyoda uzun süre hareket olmazsa uyarı gelir", "Gece kalkınca yatak–banyo yolu kendiliğinden aydınlanır"],
    items: [
      { id: "panic-button", qty: 1, room: "bed1" },
      { id: "panic-button", qty: 1, room: "bath1" },
      { id: "presence-sensor", qty: 1, room: "bath1" },
      { id: "night-light", qty: 1, room: "bed1" },
    ],
  },
  {
    id: "baby",
    title: "Bebeğiniz ya da küçük çocuğunuz var mı?",
    hint: "Ağlama algılayan kamera, oda sıcaklığı, pencere uyarısı.",
    detail: ["Kamera ağlamayı algılayınca telefonunuza bildirim gelir", "Bebek odası çok ısınır ya da soğursa uyarı alırsınız", "Pencere veya balkon kapısı açılınca haber verir"],
    items: [
      { id: "indoor-camera", qty: 1, room: "kids" },
      { id: "climate-sensor", qty: 1, room: "kids" },
      { id: "night-light", qty: 1, room: "kids" },
      { id: "door-sensor", qty: 1, room: "balconies", fallback: "kids" },
    ],
  },
  {
    id: "pets",
    title: "Evcil hayvanınız var mı?",
    hint: "Uzaktan görün ve seslenin, mamayı programlayın.",
    detail: ["Kamerayla dostunuzu görür, uzaktan seslenirsiniz", "Mama makinesi ve su pınarı prizden programla çalışır", "Ev çok ısınırsa ya da balkon açık kalırsa uyarı gelir"],
    items: [
      { id: "indoor-camera", qty: 1, room: "living" },
      { id: "smart-plug", qty: 1, room: "kitchen" },
      { id: "climate-sensor", qty: 1, room: "living" },
      { id: "door-sensor", qty: 1, room: "balconies", fallback: "living" },
    ],
  },
  {
    id: "curtains",
    title: "Perdeler kendiliğinden açılıp kapansın mı?",
    hint: "Sabah açılır, akşam kapanır.",
    detail: ["Sabah perdeler yavaşça açılarak uyandırır", "Güneş batınca kendiliğinden kapanır", "Tatildeyken açılıp kapanarak evi dolu gösterir"],
    items: [{ id: "curtain-motor", qty: 1, room: "living" }],
  },
];

export const roomProducts = {
  bed: ["colour-bulb", "night-light", "curtain-motor", "climate-sensor", "panic-button", "indoor-camera"],
  living: ["colour-bulb", "light-strip", "curtain-motor", "indoor-camera", "smart-plug", "climate-sensor"],
  kitchen: ["smoke-sensor", "gas-detector", "flood-sensor", "smart-plug", "colour-bulb", "water-valve"],
  bath: ["flood-sensor", "presence-sensor", "panic-button", "colour-bulb", "motion-sensor"],
  hall: ["motion-sensor", "door-sensor", "smart-lock", "siren", "indoor-camera", "colour-bulb"],
  balcony: ["outdoor-camera", "irrigation", "door-sensor", "light-strip", "motion-sensor"],
};
