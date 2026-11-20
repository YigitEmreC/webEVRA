// ─────────────────────────────────────────────────────────────────────────────
//  ÜRÜNLER VE PAKETLER
//  Kaynak: "Evra Ürün Tablosu" (10 Kasım 2026). Fiyatlar Türk lirası, KDV dahil
//  perakende fiyatlarıdır; kurulum ve hizmet bedeli dahil DEĞİLDİR.
//
//  Bu tek dosya Ürünler sayfasını, Paketler sayfasını, paket oluşturucuyu VE
//  sunucudaki sipariş adımını besler; fiyatı yalnızca burada değiştirmeniz yeterlidir.
//
//  Her ürün:
//  • `id`      benzersiz, küçük harf, boşluksuz. Müşterinin siparişinde olabilecek
//              bir ürünün id'sini değiştirmeyin.
//  • `name`    müşterinin gördüğü ad: ne işe yaradığını söyler, marka içermez.
//  • `model`   marka ve model (yalnızca bizim için; sitede gösterilmez).
//  • `price`   TL, KDV dahil, kuruş için nokta: 1401.70
//  • `description` tek satırlık kısa açıklama.
//  • `features` özellikleri (madde madde, kısa).
//  • `uses`    "Neler yapabilir?": ürünle kurulabilecek örnek senaryolar.
//  • `image`   isteğe bağlı fotoğraf, örn. "/assets/img/products/akilli-priz.jpg".
//              Boş bırakırsanız ("") nötr bir yer tutucu gösterilir.
//  "TAHMİN" yorumu olan fiyatlar tabloda tahmini olarak işaretlenmiştir.
// ─────────────────────────────────────────────────────────────────────────────

export const products = [
  // ── Merkez ve ekran ────────────────────────────────────────────────────────
  {
    id: "hub",
    name: "Ana Sistem 4",
    model: "Raspberry Pi 4 + SSD + Zigbee çubuğu + IR LED (Home Assistant)",
    category: "Merkez ve ekran",
    price: 11201.59, // parçaların toplamı (IR LED dahil); Zigbee çubuğu ve IR LED fiyatı TAHMİN
    description: "Evinizin beyni: bütün cihazları tek sistemde toplar.",
    features: ["Evde, yerel çalışır", "İnternet kesilse de çalışır", "Klima ve TV'yi kumanda gibi yönetir", "Sessiz, fansız"],
    uses: ["Sabah alarmla ışıklar yanar, kombi ısınmaya başlar", "Evden çıkınca tüm ışıklar ve prizler kapanır", "Bütün cihazlar tek uygulamada"],
    image: "",
  },
  {
    id: "wall-panel",
    name: "Duvar kontrol ekranı",
    model: "Sonoff NSPanel Pro (120)",
    category: "Merkez ve ekran",
    price: 6526.18,
    description: "Evi telefona uzanmadan duvardan yönetin.",
    features: ["Dokunmatik ekran", "Duvar anahtarı yerine takılır", "Tüm evi tek ekranda gösterir"],
    uses: ["Tek dokunuşla \"İyi geceler\": ışıklar söner, kapı kilitlenir", "Kameraları ve sıcaklığı duvardan görün"],
    image: "/assets/img/products/wall-panel.jpg",
  },
  {
    id: "mesh-wifi",
    name: "Ev geneli Wi-Fi (3'lü)",
    model: "TP-Link Deco E4 (3'lü)",
    category: "Merkez ve ekran",
    price: 2349.0,
    description: "Evin her köşesinde güçlü, kesintisiz Wi-Fi.",
    features: ["3 cihazlı mesh set", "Tek ağ adı", "Ölü nokta bırakmaz"],
    uses: ["Kameralar ve prizler hiç bağlantı kaybetmez", "Bahçede ve balkonda da internet"],
    image: "",
  },

  // ── Aydınlatma ─────────────────────────────────────────────────────────────
  {
    id: "colour-bulb",
    name: "Renkli akıllı ampul",
    model: "Tapo L530E",
    category: "Aydınlatma",
    price: 1200.0,
    description: "Rengi ve parlaklığı ayarlanan ampul.",
    features: ["16 milyon renk", "Kısılabilir", "Normal E27 duya takılır"],
    uses: ["Akşam olunca kendiliğinden yanar", "Film modu: ışıklar kısılır", "Sabah yavaşça aydınlanarak uyandırır"],
    image: "/assets/img/products/colour-bulb.jpg",
  },
  {
    id: "light-strip",
    name: "Akıllı LED şerit (5 m)",
    model: "Tapo L900-5",
    category: "Aydınlatma",
    price: 1400.0,
    description: "TV arkası, dolap ve merdiven için renkli şerit ışık.",
    features: ["5 metre", "Renkli", "Kesilip kısaltılabilir"],
    uses: ["TV açılınca arkası yanar", "Gece mutfak tezgâhında hafif ışık"],
    image: "/assets/img/products/light-strip.jpg",
  },
  {
    id: "night-light",
    name: "Hareketle yanan gece lambası",
    model: "Xiaomi Motion-Activated Night Light 2",
    category: "Aydınlatma",
    price: 1199.0,
    description: "Gece kalkınca yolu kendiliğinden aydınlatır.",
    features: ["Hareket sensörlü", "Göz almayan ışık", "Pille çalışır"],
    uses: ["Yatak–banyo yolunda düşme riskini azaltır", "Bebek odasında gece beslenmesi için"],
    image: "/assets/img/products/night-light.jpg",
  },

  // ── Priz ve anahtarlar ─────────────────────────────────────────────────────
  {
    id: "smart-plug",
    name: "Enerji ölçen akıllı priz",
    model: "Tapo P110M (Matter, Wi-Fi)",
    category: "Priz ve anahtarlar",
    price: 600.0, // TAHMİN
    description: "Takılı cihazı açıp kapatır, harcadığı elektriği gösterir.",
    features: ["Enerji ölçümü", "Zamanlayıcı", "Uzaktan aç-kapa"],
    uses: ["Ütü açık kaldıysa telefondan kapatın", "Isıtıcı ya da mama makinesi programla çalışsın", "Hangi cihaz çok yakıyor görün"],
    image: "/assets/img/products/smart-plug.jpg",
  },
  {
    id: "zigbee-plug",
    name: "Ağ güçlendiren akıllı priz",
    model: "Sonoff S60ZB",
    category: "Priz ve anahtarlar",
    price: 748.58,
    description: "Akıllı priz olarak çalışır, sensör ağını da güçlendirir.",
    features: ["Uzaktan aç-kapa", "Sensör ağını güçlendirir"],
    uses: ["Uzaktaki odalarda sensörler hiç kopmaz", "Lamba ve cihazları programlayın"],
    image: "/assets/img/products/zigbee-plug.jpg",
  },
  {
    id: "wall-switch",
    name: "Akıllı duvar anahtarı modülü",
    model: "Sonoff ZBMINIL2 (nötr gerekmez)",
    category: "Priz ve anahtarlar",
    price: 648.1,
    description: "Mevcut anahtarın arkasına takılır, tavan ışığını akıllı yapar.",
    features: ["Anahtar görünümü değişmez", "Nötr kablo gerekmez", "Anahtar da çalışmaya devam eder"],
    uses: ["Tavan ışıkları programla yanar", "Evden çıkınca unutulan ışık kapanır"],
    image: "/assets/img/products/wall-switch.jpg",
  },
  {
    id: "energy-meter",
    name: "Sigorta kutusu enerji ölçer",
    model: "Sonoff MINI-ZB1GP",
    category: "Priz ve anahtarlar",
    price: 798.82,
    description: "Bir hattın ne kadar elektrik harcadığını ölçer.",
    features: ["Sigorta kutusuna takılır", "Anlık ve aylık tüketim"],
    uses: ["Faturanız gelmeden tüketimi görün", "Fazla tüketimde bildirim alın"],
    image: "/assets/img/products/energy-meter.jpg",
  },

  // ── Sensörler ──────────────────────────────────────────────────────────────
  {
    id: "motion-sensor",
    name: "Hareket sensörü",
    model: "Sonoff SNZB-03P",
    category: "Sensörler",
    price: 828.96,
    description: "Hareketi algılar; ışık ve alarmı tetikler.",
    features: ["Pille çalışır", "Kablosuz", "Küçük, her yere yapışır"],
    uses: ["Koridora girince ışık yanar", "Evde kimse yokken hareket olursa bildirim"],
    image: "/assets/img/products/motion-sensor.jpg",
  },
  {
    id: "presence-sensor",
    name: "Varlık sensörü",
    model: "Sonoff SNZB-06P (mmWave)",
    category: "Sensörler",
    price: 899.3,
    description: "Hareketsiz duran kişiyi de algılar.",
    features: ["Nefes almayı bile fark eder", "Kamerasız, mahremiyete saygılı"],
    uses: ["Banyoda uzun süre hareketsizlik olursa yakınlara haber", "Odada biri varken ışık sönmez"],
    image: "/assets/img/products/presence-sensor.jpg",
  },
  {
    id: "door-sensor",
    name: "Kapı / pencere sensörü",
    model: "Sonoff SNZB-04P",
    category: "Sensörler",
    price: 700.0,
    description: "Kapı ya da pencere açılınca haber verir.",
    features: ["Pille çalışır", "Kapıya yapıştırılır"],
    uses: ["Pencere açılınca kombi durur", "Gece kapı açılırsa alarm", "Balkon kapısı açık kalırsa uyarı"],
    image: "/assets/img/products/door-sensor.jpg",
  },
  {
    id: "climate-sensor",
    name: "Sıcaklık ve nem sensörü",
    model: "Sonoff SNZB-02D",
    category: "Sensörler",
    price: 700.0,
    description: "Odanın sıcaklığını ve nemini ölçer.",
    features: ["Ekranlı", "Pille çalışır", "Geçmiş grafikleri"],
    uses: ["Oda soğuyunca ısıtma kendiliğinden açılır", "Bebek odası çok ısınırsa uyarı"],
    image: "/assets/img/products/climate-sensor.jpg",
  },
  {
    id: "air-quality",
    name: "Hava kalitesi (CO₂) sensörü",
    model: "Sonoff SAWF-08P",
    category: "Sensörler",
    price: 2506.98,
    description: "Havanın ne kadar temiz olduğunu ölçer.",
    features: ["CO₂ ölçümü", "Ekranlı"],
    uses: ["Hava ağırlaşınca \"pencereyi açın\" hatırlatması", "Aspiratör ya da havalandırma kendiliğinden çalışır"],
    image: "/assets/img/products/air-quality.jpg",
  },

  // ── Isıtma ─────────────────────────────────────────────────────────────────
  {
    id: "radiator-valve",
    name: "Akıllı radyatör vanası",
    model: "Sonoff TRVZB",
    category: "Isıtma",
    price: 1401.7,
    description: "Her odayı ayrı ısıtır, boş odayı ısıtmaz.",
    features: ["Mevcut petek vanasının yerine takılır", "Oda oda program", "Pille çalışır"],
    uses: ["Yatak odası sadece geceleri ısınır", "Pencere açılınca kendini kapatır"],
    image: "/assets/img/products/radiator-valve.jpg",
  },
  {
    id: "relay",
    name: "Kombi kontrol modülü",
    model: "Shelly 1 Gen4",
    category: "Isıtma",
    price: 1626.81,
    description: "Kombiyi telefondan ve otomasyonla açıp kapatır.",
    features: ["Kombiye bağlanır", "Mevcut termostatla birlikte çalışır"],
    uses: ["Eve dönerken yoldan kombiyi açın", "Herkes çıkınca kombi kendiliğinden kısılır"],
    image: "/assets/img/products/relay.jpg",
  },
  {
    id: "thermal-actuator",
    name: "Yerden ısıtma oda vanası",
    model: "Rcon 230 V NC termal aktüatör",
    category: "Isıtma",
    price: 750.0,
    description: "Yerden ısıtmada her odayı ayrı açıp kapatır.",
    features: ["Kollektöre takılır", "Oda başına bir adet"],
    uses: ["Kullanılmayan odanın zemini ısınmaz", "Her odaya ayrı sıcaklık"],
    image: "/assets/img/products/thermal-actuator.jpg",
  },
  {
    id: "thermostat",
    name: "Akıllı termostat",
    model: "Sonoff Thermostat Core TP-WGZBA",
    category: "Isıtma",
    price: 2004.58,
    description: "Isıtmayı programlar, uzaktan kontrol edilir.",
    features: ["Haftalık program", "Duvara takılır"],
    uses: ["Hafta içi ve hafta sonu ayrı program", "Tatildeyken ev donmasın diye düşük ısı"],
    image: "/assets/img/products/thermostat.jpg",
  },

  // ── Güvenlik ───────────────────────────────────────────────────────────────
  {
    id: "smoke-sensor",
    name: "Duman dedektörü",
    model: "Aqara SD-S01D",
    category: "Güvenlik",
    price: 2500.0,
    description: "Duman algılayınca öter ve telefona haber verir.",
    features: ["Yüksek sesli alarm", "Telefona bildirim"],
    uses: ["Siz evde yokken de yangından haberiniz olur", "Alarm çalınca bütün ışıklar yanar"],
    image: "/assets/img/products/smoke-sensor.jpg",
  },
  {
    id: "gas-detector",
    name: "Doğalgaz kaçak dedektörü",
    model: "Nous E9 (Zigbee)",
    category: "Güvenlik",
    price: 1500.0, // TAHMİN
    description: "Gaz kaçağında öter ve haber verir.",
    features: ["Yüksek sesli alarm", "Telefona bildirim"],
    uses: ["Kaçakta size ve yakınlarınıza anında haber", "Kombi kendiliğinden kapanır"],
    image: "/assets/img/products/gas-detector.jpg",
  },
  {
    id: "flood-sensor",
    name: "Su basma sensörü",
    model: "Shelly Flood Gen 4",
    category: "Güvenlik",
    price: 1500.0,
    description: "Yere su gelince haber verir.",
    features: ["Yere konur", "Pille çalışır"],
    uses: ["Çamaşır makinesi sızdırırsa erkenden fark edin", "Akıllı vanayla su kendiliğinden kesilir"],
    image: "/assets/img/products/flood-sensor.jpg",
  },
  {
    id: "panic-button",
    name: "Acil yardım butonu",
    model: "Sonoff SNZB-01P",
    category: "Güvenlik",
    price: 554.0,
    description: "Tek basışla yakınlarınıza haber verir.",
    features: ["Küçük, taşınabilir", "Pille çalışır"],
    uses: ["Düşme ya da rahatsızlıkta tek tuşla yardım", "Gece tek basışla bütün ışıklar yanar"],
    image: "/assets/img/products/panic-button.jpg",
  },
  {
    id: "indoor-camera",
    name: "İç mekan kamerası",
    model: "Tapo C210",
    category: "Güvenlik",
    price: 1367.0,
    description: "Evi uzaktan görün; sağa sola döner.",
    features: ["360° döner", "Gece görüşü", "İki yönlü konuşma", "Kayıtlar evde kalır"],
    uses: ["Bebeğiniz ağlayınca bildirim", "Evcil dostunuzla uzaktan konuşun", "Hareket olunca kayıt alır"],
    image: "/assets/img/products/indoor-camera.jpg",
  },
  {
    id: "outdoor-camera",
    name: "Dış mekan kamerası",
    model: "Sonoff CAM-B1P",
    category: "Güvenlik",
    price: 1502.18,
    description: "Kapı önü, balkon ve bahçe için suya dayanıklı kamera.",
    features: ["Yağmura dayanıklı", "Gece görüşü", "Kayıtlar evde kalır"],
    uses: ["Kapıya biri gelince bildirim", "Balkonu ve bahçeyi uzaktan izleyin"],
    image: "/assets/img/products/outdoor-camera.jpg",
  },
  {
    id: "siren",
    name: "Alarm sireni",
    model: "Fonri Wi-Fi iç ortam siren",
    category: "Güvenlik",
    price: 2054.0,
    description: "İzinsiz girişte yüksek sesle öter.",
    features: ["Yüksek ses", "Işıklı uyarı"],
    uses: ["Kapı zorlanınca hırsızı caydırır", "Duman ya da gazda evdekileri uyarır"],
    image: "/assets/img/products/siren.jpg",
  },
  {
    id: "smart-lock",
    name: "Akıllı kapı kilidi",
    model: "Aqara U200 Lite",
    category: "Güvenlik",
    price: 9500.0, // TAHMİN
    description: "Kapıyı anahtarsız, telefonla açın.",
    features: ["Mevcut kilide takılır", "Şifre, telefon ve anahtar ile açılır", "Kim ne zaman girdi kaydı"],
    uses: ["Gelen misafire uzaktan kapıyı açın", "Kapıyı kilitlemeyi unutmak yok"],
    image: "/assets/img/products/smart-lock.jpg",
  },

  // ── Perde ve panjur ────────────────────────────────────────────────────────
  {
    id: "blind-chain",
    name: "Stor perde motoru (zincirli)",
    model: "Zemismart Zigbee (zincirli stor)",
    category: "Perde ve panjur",
    price: 2000.0, // TAHMİN
    description: "Zincirli stor perdeyi motorlu yapar.",
    features: ["Mevcut perdeye takılır", "Şarjlı"],
    uses: ["Sabah perde kendiliğinden açılır", "Güneş batınca kapanır"],
    image: "",
  },
  {
    id: "blind-tube",
    name: "Boru tipi perde motoru",
    model: "Zemismart Zigbee (borulu)",
    category: "Perde ve panjur",
    price: 3500.0, // TAHMİN
    description: "Boru motorlu perdeler için akıllı motor.",
    features: ["Sessiz", "Uzaktan kontrol"],
    uses: ["Tatildeyken perdeler açılıp kapanır, ev boş görünmez"],
    image: "",
  },
  {
    id: "curtain-motor",
    name: "Kornişli perde motoru",
    model: "Şımart (klasik, kornişli)",
    category: "Perde ve panjur",
    price: 2999.0,
    description: "Klasik perdeleri programla açıp kapatır.",
    features: ["Raylı korniş", "Sessiz motor"],
    uses: ["Sabah perdeler açılarak uyandırır", "Film modunda perdeler kapanır"],
    image: "/assets/img/products/curtain-motor.jpg",
  },
  {
    id: "shutter-module",
    name: "Panjur kontrol modülü",
    model: "Sonoff MINI-ZBRBS",
    category: "Perde ve panjur",
    price: 849.06,
    description: "Elektrikli panjuru akıllı yapar.",
    features: ["Mevcut panjur motoruna takılır", "Anahtar da çalışır"],
    uses: ["Güneş doğunca panjurlar açılır", "Evden çıkınca hepsi iner"],
    image: "/assets/img/products/shutter-module.jpg",
  },

  // ── Su ve bahçe ────────────────────────────────────────────────────────────
  {
    id: "water-valve",
    name: "Akıllı ana su vanası",
    model: "Zigbee vana kolu (ana vana)",
    category: "Su ve bahçe",
    price: 1500.0, // TAHMİN
    description: "Ana su vanasını uzaktan ya da kaçakta kendiliğinden kapatır.",
    features: ["Mevcut vanaya takılır", "Uzaktan aç-kapa"],
    uses: ["Su basma sensörü kaçak görünce su kesilir", "Tatile çıkarken tek tuşla suyu kapatın"],
    image: "/assets/img/products/water-valve.jpg",
  },
  {
    id: "irrigation",
    name: "Akıllı sulama vanası",
    model: "Sonoff Hydro ONE Lite",
    category: "Su ve bahçe",
    price: 1250.98,
    description: "Bahçeyi ve saksıları programla sular.",
    features: ["Musluğa takılır", "Pille çalışır"],
    uses: ["Her sabah otomatik sulama", "Yağmur yağdıysa sulamayı atlar"],
    image: "/assets/img/products/irrigation.jpg",
  },
];

// ─────────────────────────────────────────────────────────────────────────────
//  PAKETLER
//  • `items`, yukarıdaki ürün id'lerini ve kaç adet olduğunu listeler.
//  • `price`, müşterinin paketin tamamı için ödediği tutardır (KDV dahil).
//    Yeni paket fiyatları: paket oluşturucunun formülüyle hesaplanıp binliğe
//    aşağı yuvarlanır, 1 TL düşülür (örn. 52.268 → 51.999).
//    Ayrı ayrı ürün toplamından düşükse kartta "ayrı ayrı … değerinde" yazar.
//  • `featured: true` paketi ana sayfada da gösterir.
//  • `badge` isteğe bağlı etiket, örn. "En popüler". Yoksa "" bırakın.
//  • `highlights` kartta madde madde gösterilir; kısa tutun (en fazla 5).
// ─────────────────────────────────────────────────────────────────────────────

const centralSet = [
  { id: "hub", qty: 1 },
];

export const packages = [
  {
    id: "genel-ev",
    name: "Önerilen Ev Paketi",
    context: "Konfor ve tasarruf isteyen evler için",
    price: 51999,
    featured: true,
    badge: "En popüler",
    description: "Aydınlatma, kombi kontrolü, duvar ekranı ve temel güvenlik.",
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
      "Duvar ekranından tek noktadan kontrol",
      "Renkli ampul ve LED şerit",
      "Telefondan kombi kontrolü",
      "Hareketle yanan koridor ışığı",
      "Duman, gaz ve su kaçağı uyarısı",
    ],
  },
  {
    id: "guvenlik",
    name: "Güvenlik Paketi",
    context: "Evini her an güvende tutmak isteyenler için",
    price: 71999,
    featured: false,
    badge: "En kapsamlı",
    description: "İç ve dış kameralar, akıllı kilit, alarm ve kaçak dedektörleri.",
    items: [
      ...centralSet,
      { id: "wall-panel", qty: 1 },
      { id: "outdoor-camera", qty: 2 },
      { id: "indoor-camera", qty: 2 },
      { id: "smart-lock", qty: 1 },
      { id: "door-sensor", qty: 3 },
      { id: "motion-sensor", qty: 2 },
      { id: "siren", qty: 1 },
      { id: "smoke-sensor", qty: 1 },
      { id: "gas-detector", qty: 1 },
      { id: "flood-sensor", qty: 1 },
      { id: "water-valve", qty: 1 },
    ],
    highlights: [
      "2 iç + 2 dış kamera, kayıtlar evde kalır",
      "Anahtarsız akıllı kilit",
      "Kapı, pencere ve hareket alarmı + siren",
      "Duman, gaz ve su kaçağı uyarısı",
      "Su kaçağında ana vana kendiliğinden kapanır",
    ],
  },
  {
    id: "yasli",
    name: "Yaşlı Paketi",
    context: "Bağımsız yaşamaya devam etmek isteyen büyükleriniz için",
    price: 34650,
    featured: true,
    badge: "",
    description: "Acil yardım butonları, hareketsizlik takibi ve kaçak dedektörleri.",
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
      "Olağan dışı durumda yakınlara bildirim",
      "Gece yatak–banyo yolunda otomatik ışık",
      "Duman, gaz ve su kaçağı uyarısı",
    ],
  },
  {
    id: "bebek",
    name: "Bebek Paketi",
    context: "Yeni doğan bebeği olan aileler için",
    price: 32650,
    featured: true,
    badge: "",
    description: "Ağlama algılayan kamera, oda sıcaklığı ve pencere takibi.",
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
      "Gece lambası ve ninni için tek tuş",
      "Duman ve gaz kaçağı uyarısı",
    ],
  },
  {
    id: "evcil",
    name: "Evcil Hayvan Paketi",
    context: "Evde tek kalan patili dostlarınız için",
    price: 36999,
    featured: false,
    badge: "Yeni",
    description: "Konuşabilen kameralar, mama/su için akıllı priz, sıcaklık ve kapı takibi.",
    items: [
      ...centralSet,
      { id: "indoor-camera", qty: 2 },
      { id: "smart-plug", qty: 2 },
      { id: "climate-sensor", qty: 1 },
      { id: "door-sensor", qty: 2 },
      { id: "motion-sensor", qty: 1 },
      { id: "smoke-sensor", qty: 1 },
      { id: "flood-sensor", qty: 1 },
    ],
    highlights: [
      "Kamerayla görün, uzaktan seslenin",
      "Mama makinesi ve su pınarı programla çalışır",
      "Ev çok ısınır ya da soğursa bildirim",
      "Kapı ya da balkon açık kalırsa uyarı",
      "Duman ve su kaçağı uyarısı",
    ],
  },
];
