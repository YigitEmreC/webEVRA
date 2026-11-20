// ─────────────────────────────────────────────────────────────────────────────
//  "KENDİ PAKETİNİ OLUŞTUR" (Paketler sayfasının üstü)
//  Adımlar: 1 Ev büyüklüğü → 2 Isıtma sistemi → 3 Sistem (zorunlu ürünler)
//           → 4 Ürünler → 5 Özet ve fiyat
//  Fiyat hesabı settings.js → pricing bölümündedir.
//
//  • homeSizes: `rooms`, "oda başına" ürünlerin başlangıç adedidir (salon dahil).
//    `large: true` olan seçenek paket oluşturmaz; planlama formunu açar.
//  • systemItems: her pakette zorunlu ürünler (en az `min` adet).
//  • heatingSystems: müşterinin seçtiği ısıtma sistemine göre eklenen ürünler.
//    qty: sayı ya da "rooms" (oda sayısı kadar). min: en az kaç adet olmalı
//    (0 = önerilir ama çıkarılabilir).
//  Ürün id'leri catalog.js'teki ürünlerle aynı olmalı.
// ─────────────────────────────────────────────────────────────────────────────

export const CUSTOM_ID = "ozel";
export const CUSTOM_NAME = "Kendi Paketiniz";

export const homeSizes = [
  { id: "1+1", label: "1+1", rooms: 2 },
  { id: "2+1", label: "2+1", rooms: 3 },
  { id: "3+1", label: "3+1", rooms: 4 },
  { id: "4+1", label: "4+1", rooms: 5 },
  { id: "5+1+", label: "5+1 ve üzeri", large: true },
];

export const systemItems = [
  { id: "hub", qty: 1, min: 1 },
  { id: "wall-panel", qty: 1, min: 1 },
];

export const heatingSystems = [
  {
    id: "kombi-petek",
    name: "Kombi + petek (radyatör)",
    text: "Kombiyi akıllı röle ile kontrol ediyoruz; peteklere akıllı vana takarak her odayı ayrı ısıtabilirsiniz.",
    items: [
      { id: "relay", qty: 1, min: 1 },
      { id: "radiator-valve", qty: "rooms", min: 0 },
    ],
  },
  {
    id: "kombi-yerden",
    name: "Kombi + yerden ısıtma",
    text: "Kombiyi akıllı röle ile, her bölgeyi termal aktüatör ile kontrol ediyoruz.",
    items: [
      { id: "relay", qty: 1, min: 1 },
      { id: "thermal-actuator", qty: "rooms", min: 1 },
    ],
  },
  {
    id: "merkezi-petek",
    name: "Merkezi sistem / kalorifer (petek)",
    text: "Kazan bina ortak olduğu için peteklere akıllı radyatör vanası takıyoruz.",
    items: [{ id: "radiator-valve", qty: "rooms", min: 1 }],
  },
  {
    id: "merkezi-yerden",
    name: "Merkezi sistem + yerden ısıtma",
    text: "Akıllı termostat ve her bölge için termal aktüatör kullanıyoruz.",
    items: [
      { id: "thermostat", qty: 1, min: 1 },
      { id: "thermal-actuator", qty: "rooms", min: 1 },
    ],
  },
  {
    id: "klima",
    name: "Klima / ısı pompası",
    text: "Klimalar Ana Sistem 4'teki kızılötesi verici ile kontrol edilir; sıcaklık sensörü odayı takip eder.",
    items: [{ id: "climate-sensor", qty: 1, min: 1 }],
  },
  {
    id: "elektrikli",
    name: "Elektrikli ısıtıcı / soba",
    text: "Isıtıcıları enerji ölçen akıllı prizle programlıyoruz.",
    items: [{ id: "smart-plug", qty: 1, min: 1 }],
  },
];
