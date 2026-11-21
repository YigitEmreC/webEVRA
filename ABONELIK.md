# Aylık abonelik (Güvence / Premium): nasıl bağlanır

Sitede hazır olanlar:

| Parça | Dosya | Ne yapar |
|---|---|---|
| Plan seçimi (zorunlu) | `public/cart.html`, `public/assets/js/plans.js`, `cart-page.js` | Siparişim sayfasında karşılaştırma tablosu çıkar; müşteri Temel (ücretsiz), Güvence veya Premium seçmeden talep gönderemez. |
| Siparişe ekleme | `functions/api/order.js` | Seçilen plan satış e-postasına ve müşterinin onay e-postasına yazılır. |
| Ödeme katmanı | `lib/billing.js` | Ödeme kuruluşuyla konuşan tek yer. Şu an **iyzico** için yazılı. |
| API | `functions/api/subscription.js` | `/api/subscription` (kart formunu açar), `/api/subscription/callback` (müşteri geri döner), `/api/subscription/webhook` (yenileme / başarısız ödeme bildirimi). Her sonuç satis@ adresine e-posta olarak gelir. |
| Sayfalar | `public/abonelik.html`, `public/assets/js/subscribe.js`, `order-success.html` | Teşekkür sayfasında “Kartımı kaydet” → fatura bilgileri → ödeme kuruluşunun kendi kart formu. |

**Bağlanana kadar:** Hiçbir şey tahsil edilmez. Plan e-postada gelir, teşekkür sayfası “ödeme yöntemini sizi aradığımızda belirleyeceğiz” der. Siz aboneliği elle (ör. kurulum günü) başlatırsınız.

---

## iyzico ile bağlama (önerilen)

1. **Üye işyeri olun:** iyzico.com → Üye işyeri başvurusu. Şirket evrakı (vergi levhası, imza sirküleri, IBAN) istenir. **Abonelik (Subscription) ürününü** hesabınızda açtırın; ayrıca aktivasyon gerekir, müşteri temsilcinize söyleyin.
2. **Önce sandbox (test) hesabı:** sandbox-merchant.iyzipay.com adresinden ücretsiz test hesabı açın.
3. **Ürün ve plan oluşturun** (panel → Abonelik):
   - Ürün: “Evra Bakım Planı”
   - Ödeme planları: **Güvence** 340 TL / aylık, **Premium** 600 TL / aylık
   - **Deneme süresi (trial)**: ör. 30 gün. Böylece kart bugün kaydedilir, ilk çekim kurulumdan sonra olur.
   - Her planın **referans kodunu** kopyalayın.
4. **Kodları siteye yazın:** `public/data/settings.js` → `billing.planCodes`:
   ```js
   planCodes: { guvence: "xxxxxxxx-....", premium: "yyyyyyyy-...." },
   ```
5. **Anahtarları Cloudflare'a girin** (Workers → evra → Settings → Variables and Secrets). Hepsini **Secret** olarak ekleyin, dosyalara yazmayın:
   | Ad | Değer |
   |---|---|
   | `BILLING_PROVIDER` | `iyzico` |
   | `IYZICO_API_KEY` | panel → Ayarlar → API anahtarı |
   | `IYZICO_SECRET_KEY` | panel → Ayarlar → Gizli anahtar |
   | `IYZICO_MERCHANT_ID` | panel → Ayarlar → Üye işyeri numarası |
   | `IYZICO_BASE_URL` | test: `https://sandbox-api.iyzipay.com` · canlı: `https://api.iyzipay.com` |
6. **Bildirim adresi:** iyzico paneli → Ayarlar → Bildirim/Webhook URL: `https://<alan-adınız>/api/subscription/webhook`.
7. **Deploy edin** (`npx wrangler deploy` ya da GitHub'a gönderin).
8. **Test edin (sandbox):** Paket seçin → Güvence → talep gönderin → teşekkür sayfasında “Kartımı kaydet” → iyzico test kartı (iyzico dokümanındaki test kartları) → satis@ adresine “Yeni abonelik” e-postası gelmeli.
9. Çalışınca `IYZICO_BASE_URL`'i canlı adrese, anahtarları canlı anahtarlara çevirin.

> ⚠ `lib/billing.js` içindeki iyzico kodu iyzico'nun abonelik dokümanına göre yazıldı ama gerçek bir hesapla henüz denenmedi. Sandbox'ta 8. adımı mutlaka yapın. Bir hata çıkarsa (ör. imza veya alan adı farkı) Cloudflare → Workers → evra → **Logs** bölümündeki mesajla birlikte bana iletin.

**Müşteri ne görür?** Kart bilgisi sizin sitenize hiç girmez; iyzico'nun kendi formu sayfada açılır. Bu yüzden PCI-DSS yükü sizde değil. Fatura için iyzico T.C. kimlik no, ad soyad, cep telefonu ve adres ister; form bunları sorar.

**İptal / plan değiştirme:** İlk aşamada iyzico panelinden elle yapılır (müşteri arar veya destek talebi açar). Sonradan “müşteri paneli” eklenebilir.

---

## Alternatifler

| Seçenek | Türkiye'de | Abonelik | Artısı | Eksisi |
|---|---|---|---|---|
| **iyzico Abonelik** (hazır) | ✓ | Yerleşik (plan, deneme süresi, otomatik yeniden deneme) | Türk kartları ve taksit, tanınan marka, yerleşik abonelik API'si; kod hazır | Abonelik ürünü ayrıca açtırılmalı |
| **PayTR** (kart saklama + tekrarlayan ödeme) | ✓ | Yarı hazır: kartı saklar, her ay çekimi **siz** başlatırsınız | Komisyonlar genelde rekabetçi, hızlı onay | Aylık çekim için zamanlanmış iş (Cloudflare Cron Trigger) yazmak gerekir |
| **Param / Sipay / Craftgate** | ✓ | Kart saklama + tekrarlayan ödeme (sağlayıcıya göre değişir) | Craftgate birden fazla bankayı tek API'de birleştirir | Entegrasyon PayTR'ye benzer, biraz daha iş |
| **Banka sanal POS'u** (Garanti, İş Bankası …) | ✓ | “Tekrarlayan ödeme” özelliği bankaya bağlı | Komisyon pazarlıkla düşebilir | Her bankanın API'si farklı, 3D Secure akışı ağır |
| **Stripe Billing** | ✗ (Türk şirketine açık değil) | En gelişmiş | Mükemmel abonelik altyapısı | Yurtdışı şirket gerekir; TL kartlarda sorun |
| **Elle: havale / otomatik ödeme talimatı** | ✓ | Yok | Sıfır entegrasyon, komisyon yok | Takip sizde, gecikme riski; şu anki varsayılan durum |

**Öneri:** iyzico ile başlayın; kod hazır, abonelik mantığı (deneme süresi, başarısız ödemede yeniden deneme) onların tarafında. Komisyon oranlarını iyzico ve PayTR'den yazılı teklif alarak karşılaştırın; oran PayTR'de belirgin daha iyiyse `lib/billing.js`'e bir PayTR bölümü ve aylık çekim için bir Cron Trigger ekleyebiliriz. Site tarafı (plan seçimi, sayfalar, e-postalar) değişmez.
