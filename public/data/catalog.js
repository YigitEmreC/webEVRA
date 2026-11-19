// ─────────────────────────────────────────────────────────────────────────────
//  ÜRÜNLER VE PAKETLER
//  Kaynak: "Evra Ürün Tablosu" (10 Kasım 2026). Fiyatlar Türk lirası, KDV dahil
//  perakende fiyatlarıdır; kurulum ve hizmet bedeli dahil DEĞİLDİR.
//
//  Bu tek dosya Ürünler sayfasını, Paketler sayfasını, sepeti VE sunucudaki
//  ödeme adımını besler; fiyatı yalnızca burada değiştirmeniz yeterlidir.
//
//  Kurallar:
//  • Her `id` benzersiz, küçük harf ve boşluksuz olmalı (boşluk yerine -).
//    Müşterinin sepetinde olabilecek bir ürünün id'sini değiştirmeyin.
//  • `price` TL cinsinden, KDV dahil, kuruş için nokta: 1401.70
//  • `image` isteğe bağlı. Fotoğrafı public/assets/img/products/ içine koyup
//    yolunu yazın, örn. "/assets/img/products/akilli-priz.jpg".
//    Boş bırakırsanız ("") nötr bir yer tutucu gösterilir.
//  • "TAHMİN" yorumu olan fiyatlar tabloda tahmini olarak işaretlenmiştir,
//    teyit edildikten sonra güncelleyin.
// ─────────────────────────────────────────────────────────────────────────────

export const products = [
  // ── Merkez ve ekran ────────────────────────────────────────────────────────
  {
    id: "hub",
    name: "Ana Sistem 4",
    category: "Merkez ve ekran",
    price: 11201.59, // parçaların toplamı (IR LED dahil); Zigbee çubuğu ve IR LED fiyatı TAHMİN
    description: "Sistemin merkezi. Tüm otomasyonlar evinizde, yerel olarak çalışır. Raspberry Pi 4 tabanlı Home Assistant sunucusu; klima ve TV gibi kumandalı cihazları da uygulamadan kontrol eder.",
    features: ["Yerel kontrol", "İnternetsiz çalışır", "Zigbee & Thread desteği", "Klima ve TV kontrolü (IR)", "Fansız, sessiz tasarım", "Hızlı SSD depolama"],
    image: "",
  },
  {
    id: "wall-panel",
    name: "Duvar ekranı – Sonoff NSPanel Pro (120)",
    category: "Merkez ve ekran",
    price: 6526.18,
    description: "Işıkları, ısıtmayı ve senaryoları telefona uzanmadan duvardaki dokunmatik ekrandan kontrol edin.",
    features: ["Dokunmatik ekran", "Wi-Fi"],
    image: "/assets/img/products/wall-panel.jpg",
  },
  {
    id: "mesh-wifi",
    name: "Mesh Wi-Fi – TP-Link Deco E4 (3'lü)",
    category: "Merkez ve ekran",
    price: 2349.0,
    description: "Evin her köşesinde güçlü ve kesintisiz Wi-Fi.",
    features: ["3'lü set", "Mesh"],
    image: "",
  },

  // ── Aydınlatma ─────────────────────────────────────────────────────────────
  {
    id: "colour-bulb",
    name: "Akıllı ampul – Tapo L530E",
    category: "Aydınlatma",
    price: 1200.0,
    description: "Renkli ve kısılabilir akıllı ampul. Standart E27 duya uyar.",
    features: ["Renkli", "Kısılabilir", "Wi-Fi"],
    image: "/assets/img/products/colour-bulb.jpg",
  },
  {
    id: "light-strip",
    name: "LED şerit ışık – Tapo L900-5 (5 metre)",
    category: "Aydınlatma",
    price: 1400.0,
    description: "Dolap, TV duvarı ve merdivenler için renkli LED şerit.",
    features: ["5 metre", "Renkli", "Wi-Fi"],
    image: "/assets/img/products/light-strip.jpg",
  },
  {
    id: "night-light",
    name: "Xiaomi hareket sensörlü gece lambası 2",
    category: "Aydınlatma",
    price: 1199.0,
    description: "Gece yataktan kalktığınızda yolu kendiliğinden aydınlatır.",
    features: ["Hareket sensörlü", "Bağımsız çalışır"],
    image: "/assets/img/products/night-light.jpg",
  },

  // ── Priz ve anahtarlar ─────────────────────────────────────────────────────
  {
    id: "smart-plug",
    name: "Akıllı priz – Tapo P110M (Matter, Wi-Fi)",
    category: "Priz ve anahtarlar",
    price: 600.0, // TAHMİN
    description: "Herhangi bir cihazı zamanlayarak açıp kapatın ve ne kadar enerji harcadığını görün.",
    features: ["Enerji ölçümü", "Matter", "Wi-Fi"],
    image: "/assets/img/products/smart-plug.jpg",
  },
  {
    id: "zigbee-plug",
    name: "Zigbee akıllı priz – Sonoff S60ZB",
    category: "Priz ve anahtarlar",
    price: 748.58,
    description: "Zigbee ağını güçlendiren, uzaktan kontrol edilebilen akıllı priz.",
    features: ["Zigbee", "Ağı güçlendirir"],
    image: "/assets/img/products/zigbee-plug.jpg",
  },
  {
    id: "wall-switch",
    name: "Akıllı duvar anahtarı – Sonoff ZBMINIL2 (nötr gerekmez)",
    category: "Priz ve anahtarlar",
    price: 648.1,
    description: "Mevcut duvar anahtarının arkasına takılır, ışıkları akıllı hale getirir.",
    features: ["Nötr gerekmez", "Zigbee"],
    image: "/assets/img/products/wall-switch.jpg",
  },
  {
    id: "energy-meter",
    name: "Enerji ölçer (sigorta kutusu) – Sonoff MINI-ZB1GP",
    category: "Priz ve anahtarlar",
    price: 798.82,
    description: "Sigorta kutusuna takılır, hattın enerji tüketimini ölçer.",
    features: ["Enerji ölçümü", "Zigbee"],
    image: "/assets/img/products/energy-meter.jpg",
  },

  // ── Sensörler ──────────────────────────────────────────────────────────────
  {
    id: "motion-sensor",
    name: "Hareket sensörü – Sonoff SNZB-03P",
    category: "Sensörler",
    price: 828.96,
    description: "Odaya girdiğinizde ışıkları açar, oda boşaldığında kapatır.",
    features: ["Pilli", "Zigbee"],
    image: "/assets/img/products/motion-sensor.jpg",
  },
  {
    id: "presence-sensor",
    name: "Varlık sensörü (mmWave) – Sonoff SNZB-06P",
    category: "Sensörler",
    price: 899.3,
    description: "Hareketsiz duran kişiyi de algılar; banyo ve yaşlı bakımı için ideal.",
    features: ["mmWave", "Zigbee"],
    image: "/assets/img/products/presence-sensor.jpg",
  },
  {
    id: "door-sensor",
    name: "Kapı / pencere sensörü – Sonoff SNZB-04P",
    category: "Sensörler",
    price: 700.0,
    description: "Kapı veya pencere açıldığında haber verir, ışıkları ya da alarmı tetikler.",
    features: ["Pilli", "Zigbee"],
    image: "/assets/img/products/door-sensor.jpg",
  },
  {
    id: "climate-sensor",
    name: "Sıcaklık ve nem sensörü – Sonoff SNZB-02D",
    category: "Sensörler",
    price: 700.0,
    description: "Ekranında oda sıcaklığını ve nemi gösterir, değerleri uygulamaya kaydeder.",
    features: ["LCD ekran", "Pilli", "Zigbee"],
    image: "/assets/img/products/climate-sensor.jpg",
  },
  {
    id: "air-quality",
    name: "Hava kalitesi (CO2) sensörü – Sonoff SAWF-08P",
    category: "Sensörler",
    price: 2506.98,
    description: "Ortamdaki CO2 seviyesini ölçer; havalandırma zamanını hatırlatır.",
    features: ["CO2", "Matter", "Wi-Fi"],
    image: "/assets/img/products/air-quality.jpg",
  },

  // ── Isıtma ─────────────────────────────────────────────────────────────────
  {
    id: "radiator-valve",
    name: "Akıllı termostatik radyatör vanası – Sonoff TRVZB",
    category: "Isıtma",
    price: 1401.7,
    description: "Her odayı yalnızca gerektiğinde, programa göre ya da evde biri varken ısıtır.",
    features: ["Oda bazlı program", "Zigbee"],
    image: "/assets/img/products/radiator-valve.jpg",
  },
  {
    id: "relay",
    name: "Akıllı röle – Shelly 1 Gen4",
    category: "Isıtma",
    price: 1626.81,
    description: "Kombiyi veya yerden ısıtmayı uygulamadan ve otomasyonlarla kontrol eder.",
    features: ["Kombi / yerden ısıtma", "Wi-Fi"],
    image: "/assets/img/products/relay.jpg",
  },
  {
    id: "thermal-actuator",
    name: "230 V NC termal aktüatör – Rcon",
    category: "Isıtma",
    price: 750.0,
    description: "Yerden ısıtmada her bölgeyi ayrı ayrı açıp kapatır. Bölge başına bir adet.",
    features: ["Yerden ısıtma", "230 V"],
    image: "/assets/img/products/thermal-actuator.jpg",
  },
  {
    id: "thermostat",
    name: "Akıllı termostat – Sonoff Thermostat Core TP-WGZBA",
    category: "Isıtma",
    price: 2004.58,
    description: "Isıtma sistemini programlayan ve uzaktan kontrol edilen akıllı termostat.",
    features: ["Programlanabilir", "Zigbee"],
    image: "/assets/img/products/thermostat.jpg",
  },

  // ── Güvenlik ───────────────────────────────────────────────────────────────
  {
    id: "smoke-sensor",
    name: "Duman sensörü – Aqara SD-S01D",
    category: "Güvenlik",
    price: 2500.0,
    description: "Duman algıladığında hem ötüp hem de telefonunuza bildirim gönderir.",
    features: ["Alarm + bildirim", "Zigbee"],
    image: "/assets/img/products/smoke-sensor.jpg",
  },
  {
    id: "gas-detector",
    name: "Doğalgaz kaçak dedektörü – Nous E9 (Zigbee)",
    category: "Güvenlik",
    price: 1500.0, // TAHMİN
    description: "Doğalgaz kaçağında alarm verir ve anında haber gönderir.",
    features: ["Alarm + bildirim", "Zigbee"],
    image: "/assets/img/products/gas-detector.jpg",
  },
  {
    id: "flood-sensor",
    name: "Su basma sensörü – Shelly Flood Gen 4",
    category: "Güvenlik",
    price: 1500.0,
    description: "Banyo, mutfak veya kazan dairesinde su kaçağını erkenden fark eder.",
    features: ["Su kaçağı", "Wi-Fi"],
    image: "/assets/img/products/flood-sensor.jpg",
  },
  {
    id: "panic-button",
    name: "Acil yardım butonu – Sonoff SNZB-01P",
    category: "Güvenlik",
    price: 554.0,
    description: "Tek dokunuşla yakınlarınıza haber verir; ayrıca ışık veya senaryo tetikleyebilir.",
    features: ["Tek dokunuş", "Zigbee"],
    image: "/assets/img/products/panic-button.jpg",
  },
  {
    id: "indoor-camera",
    name: "İç mekan kamerası – Tapo C210",
    category: "Güvenlik",
    price: 1367.0,
    description: "Döner başlıklı iç mekan kamerası; evi uzaktan görün, bebek ağlamasını algılayın.",
    features: ["Döner başlık", "Yerel görüntü", "Wi-Fi"],
    image: "/assets/img/products/indoor-camera.jpg",
  },
  {
    id: "outdoor-camera",
    name: "Dış mekan kamerası – Sonoff CAM-B1P",
    category: "Güvenlik",
    price: 1502.18,
    description: "Bahçe, giriş ve otopark için dış mekan kamerası.",
    features: ["Dış mekan", "Yerel görüntü", "Wi-Fi"],
    image: "/assets/img/products/outdoor-camera.jpg",
  },
  {
    id: "siren",
    name: "İç ortam siren – Fonri Wi-Fi",
    category: "Güvenlik",
    price: 2054.0,
    description: "Alarm durumunda evin içinde yüksek sesle uyarı verir.",
    features: ["Wi-Fi"],
    image: "/assets/img/products/siren.jpg",
  },
  {
    id: "smart-lock",
    name: "Akıllı kilit – Aqara U200 Lite",
    category: "Güvenlik",
    price: 9500.0, // TAHMİN
    description: "Kapıyı anahtarsız, telefonla veya otomasyonla açıp kilitleyin.",
    features: ["Anahtarsız giriş", "Matter over Thread"],
    image: "/assets/img/products/smart-lock.jpg",
  },

  // ── Perde ve panjur ────────────────────────────────────────────────────────
  {
    id: "blind-chain",
    name: "Akıllı perde motoru (stor, zincirli) – Zemismart Zigbee",
    category: "Perde ve panjur",
    price: 2000.0, // TAHMİN
    description: "Zincirli stor perdeleri motorlu ve akıllı hale getirir.",
    features: ["Stor perde", "Zigbee"],
    image: "",
  },
  {
    id: "blind-tube",
    name: "Akıllı perde motoru (borulu) – Zemismart Zigbee",
    category: "Perde ve panjur",
    price: 3500.0, // TAHMİN
    description: "Boru motorlu perdeler için Zigbee kontrollü motor.",
    features: ["Boru motor", "Zigbee"],
    image: "",
  },
  {
    id: "curtain-motor",
    name: "Akıllı perde motoru (klasik, kornişli) – Şımart",
    category: "Perde ve panjur",
    price: 2999.0,
    description: "Klasik kornişli perdeleri programa göre veya uygulamadan açıp kapatır.",
    features: ["Kornişli perde", "Wi-Fi"],
    image: "/assets/img/products/curtain-motor.jpg",
  },
  {
    id: "shutter-module",
    name: "Elektrikli panjur modülü – Sonoff MINI-ZBRBS",
    category: "Perde ve panjur",
    price: 849.06,
    description: "Mevcut panjur motorunuzu akıllı hale getirir.",
    features: ["Mevcut motora", "Zigbee"],
    image: "/assets/img/products/shutter-module.jpg",
  },

  // ── Su ve bahçe ────────────────────────────────────────────────────────────
  {
    id: "water-valve",
    name: "Akıllı su vanası – Zigbee vana kolu (ana vana)",
    category: "Su ve bahçe",
    price: 1500.0, // TAHMİN
    description: "Ana su vanasını uzaktan veya su kaçağı algılandığında otomatik kapatır.",
    features: ["Ana vana", "Zigbee"],
    image: "/assets/img/products/water-valve.jpg",
  },
  {
    id: "irrigation",
    name: "Akıllı sulama – Sonoff Hydro ONE Lite",
    category: "Su ve bahçe",
    price: 1250.98,
    description: "Bahçeyi ve saksıları programa göre sular.",
    features: ["Programlı sulama", "Zigbee"],
    image: "/assets/img/products/irrigation.jpg",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  PAKETLER
//  • `items`, yukarıdaki ürün id'lerini ve kaç adet olduğunu listeler.
//  • `price`, müşterinin paketin tamamı için ödediği tutardır (kurulum dahil
//    olabilir). Ayrı ayrı ürün toplamından düşükse kartta otomatik olarak
//    "ayrı ayrı … değerinde" yazar.
//    Fiyatlar KDV dahil satış fiyatıdır.
//  • `featured: true` paketi ana sayfada da gösterir.
//  • `badge` isteğe bağlı etiket, örn. "En popüler". Yoksa "" bırakın.
// ─────────────────────────────────────────────────────────────────────────────

const centralSet = [
  { id: "hub", qty: 1 },
];

export const packages = [
  {
    id: "genel-ev",
    name: "Genel Ev Paketi",
    context: "Konfor ve enerji tasarrufu isteyen evler için",
    price: 54999,
    featured: true,
    badge: "En popüler",
    description: "Aydınlatma, kombi kontrolü, duvar ekranı ve temel güvenlik sensörleriyle eksiksiz bir akıllı ev başlangıcı.",
    items: [
      ...centralSet,
      { id: "wall-panel", qty: 1 },
      { id: "smart-plug", qty: 2 },
      { id: "light-strip", qty: 1 },
      { id: "colour-bulb", qty: 2 },
      { id: "relay", qty: 1 },
      { id: "climate-sensor", qty: 1 },
      { id: "motion-sensor", qty: 1 },
      { id: "door-sensor", qty: 1 },
      { id: "smoke-sensor", qty: 1 },
      { id: "flood-sensor", qty: 1 },
      { id: "gas-detector", qty: 1 },
    ],
    highlights: [
      "Ana sistem ve duvar ekranından tek noktadan kontrol",
      "Renkli akıllı ampuller ve LED şerit ile aydınlatma",
      "Kombi kontrolü ve sıcaklık takibi",
      "Prizlerde enerji tüketimi takibi",
      "Koridorda hareketle otomatik yanan ışık",
      "Kapı açılınca bildirim",
      "Duman, su basma ve gaz kaçağı uyarıları",
    ],
  },
  {
    id: "yasli",
    name: "Yaşlı Paketi",
    context: "Bağımsız yaşamaya devam etmek isteyen büyükleriniz için",
    price: 37650,
    featured: true,
    badge: "",
    description: "Hareket ve varlık sensörleri, acil yardım butonları ve güvenlik dedektörleriyle yakınlarınız güvende, siz içiniz rahat olacak.",
    items: [
      ...centralSet,
      { id: "indoor-camera", qty: 1 },
      { id: "motion-sensor", qty: 2 },
      { id: "presence-sensor", qty: 1 },
      { id: "door-sensor", qty: 1 },
      { id: "gas-detector", qty: 1 },
      { id: "smoke-sensor", qty: 1 },
      { id: "flood-sensor", qty: 1 },
      { id: "panic-button", qty: 2 },
      { id: "night-light", qty: 1 },
    ],
    highlights: [
      "Yatak başı ve banyoda acil yardım butonu",
      "Banyoda hareketsizlik algılama",
      "Gün içi hareket takibi, olağan dışı durumda yakınlara bildirim",
      "Kamerayla evi uzaktan görme",
      "Gece yatak–banyo yolunda otomatik ışık",
      "Giriş kapısı açılınca bildirim",
      "Duman, su basma ve gaz kaçağı uyarıları",
    ],
  },
  {
    id: "bebek",
    name: "Bebek Paketi",
    context: "Yeni doğan bebeği olan aileler için",
    price: 35650,
    featured: true,
    badge: "",
    description: "Ağlama algılayan kamera, oda sıcaklığı takibi, pencere sensörleri ve güvenlik dedektörleriyle bebek odası kontrol altında.",
    items: [
      ...centralSet,
      { id: "indoor-camera", qty: 1 },
      { id: "climate-sensor", qty: 1 },
      { id: "door-sensor", qty: 2 },
      { id: "smoke-sensor", qty: 1 },
      { id: "gas-detector", qty: 1 },
      { id: "night-light", qty: 1 },
      { id: "smart-plug", qty: 1 },
      { id: "panic-button", qty: 1 },
    ],
    highlights: [
      "Ağlama algılayan kamera",
      "Bebek odasında sıcaklık ve nem takibi",
      "Pencere ve balkon açılınca uyarı",
      "Isıtıcı / nemlendirici için akıllı priz",
      "Gece ışığı ve ninni için tek tuş",
      "Duman ve gaz kaçağı uyarıları",
    ],
  },
];
