# Company website template

A static website with a shop cart, Stripe checkout, a contact form that answers automatically, and a support portal. It's hosted on **Cloudflare Pages** and deployed from **GitHub**.

There is no build step and nothing to install: plain HTML, CSS and JavaScript, plus three small server functions.

```
website/
├── public/                  ← the website itself (Cloudflare serves this folder)
│   ├── index.html           Home: introduction, preview video, company details
│   ├── products.html        Full product list with prices, filters, add to cart
│   ├── packages.html        Packages, orderable online
│   ├── cart.html            Cart and "Go to secure checkout"
│   ├── order-success.html   Shown after a successful payment
│   ├── services.html        Installation procedure, support and maintenance
│   ├── information.html     About the company and owners
│   ├── support.html         Support/maintenance request portal and FAQ
│   ├── contact.html         Contact form ("e-mail bot") and contact details
│   ├── privacy.html, terms.html, 404.html
│   ├── data/
│   │   ├── catalog.js       ★ products, packages and prices
│   │   └── settings.js      ★ currency, delivery fee, countries, company name
│   └── assets/              css, js, images, video
├── functions/api/           ← server code (Cloudflare Pages Functions)
│   ├── checkout.js          creates the Stripe payment page
│   ├── contact.js           e-mails contact messages and sends an auto-reply
│   └── support.js           e-mails support requests with a reference number
└── lib/
    ├── email-templates.js   ★ wording of the automatic e-mails
    ├── email.js, http.js    helpers
```

---

## 1. Fill in your text

Every piece of text to replace is written **in square brackets**, like `[Company]` or `[Introduction: …]`. Search the project for `[` to find them all. The text inside each bracket says what to write there.

**Replace these across all files at once.** In VS Code: *Edit → Replace in Files*, `Ctrl+Shift+H`.

| Placeholder | Example |
|---|---|
| `[Company]` | Your company name (also used in `public/data/settings.js`) |
| `[info@yourdomain.com]` | Your e-mail address |
| `[+31000000000]` | Your phone number for links, digits only |
| `[+31 (0)00 000 0000]` | Your phone number as people should read it |
| `[Street 1, 1234 AB City]` | Your address |
| `[00000000]` | KvK number |
| `[NL000000000B01]` | VAT number |

**Header and footer.** They are identical on every page, so use *Replace in Files* to change a menu item or footer link everywhere.

**Products and packages.** Edit `public/data/catalog.js`. Instructions are at the top of that file. The products in it are examples; replace them with your own range and prices. The same file sets prices for the website and for the checkout, so you only change a price in one place.

**Photos**
- Products: put the image in `public/assets/img/products/` and set `image: "/assets/img/products/name.jpg"` in `catalog.js`.
- Team, story and map: look for the `<!-- EDIT: ... -->` comments in `information.html` and `contact.html`.
- Logo: replace `public/assets/img/logo.svg` and `favicon.svg`.

**Home page video.** Put your video at `public/assets/video/setup-preview.mp4`. Cloudflare Pages allows **25 MiB per file**, so compress it: 1080p, about 1 minute, H.264. Also replace `public/assets/img/video-poster.svg` with a still from the video.
If the video is larger, upload it to YouTube and swap the `<video>…</video>` block in `index.html` for:

```html
<iframe src="https://www.youtube-nocookie.com/embed/VIDEO_ID" title="Setup preview"
        allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>
```

**Colours.** Change `--accent` at the top of `public/assets/css/style.css`. Change the dark-mode version a few lines below it too.

**FAQ.** The questions are plain HTML in `support.html`. Copy a `<details class="faq-item">` block to add one. Each `faq-group` automatically becomes a filter button. The troubleshooting answers are generic drafts, so check that they match your devices.

**Automatic e-mail wording.** Edit `lib/email-templates.js`.

**Legal pages.** `privacy.html` and `terms.html` are starting points, not legal advice. Have them checked before you take real orders.

---

## 2. Preview on your computer

**Pages only (no forms or checkout).** This needs [Python](https://www.python.org/downloads/).

- **Windows:** double-click **`start-local.bat`**. Your browser opens the site. Close the black window to stop it.
- **Mac/Linux:** run `python3 tools/serve.py`.

Edit files in `public/` and refresh the browser to see the change. In this preview the forms and the checkout show a "switched off" message.

Opening the HTML files directly by double-clicking them doesn't work, because the browser blocks the scripts on `file://` pages.

**Everything, including forms and checkout.** This needs [Node.js](https://nodejs.org). Copy `.dev.vars.example` to `.dev.vars`, fill in test keys, then run:

```bash
npx wrangler pages dev public
```

Then open http://localhost:8788.

---

## 3. Put it on GitHub and Cloudflare

1. Create a repository on GitHub and push this `website` folder to it. `.gitignore` already keeps your local keys (`.dev.vars`) out of the repository.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**, then pick the repository.
3. Build settings:
   - Framework preset: **None**
   - Build command: *leave empty*
   - Build output directory: **`public`**
   - Root directory: `/`, or the folder name if `website` is a subfolder of the repository
4. Click **Save and Deploy**. From then on, every push to the main branch updates the live site. Other branches get their own preview URL.
5. Optional: add your own domain under **Custom domains**.
6. Add the secret keys under **Settings → Variables and Secrets**. Steps 4 and 5 below explain each one. Redeploy after adding them.

| Name | Needed for | Example |
|---|---|---|
| `STRIPE_SECRET_KEY` | Checkout | `sk_test_…` while testing, `sk_live_…` when live |
| `RESEND_API_KEY` | Contact and support forms | `re_…` |
| `MAIL_FROM` | Contact and support forms | `Your Company <noreply@yourdomain.com>` |
| `CONTACT_TO` | Contact form inbox | `info@yourdomain.com` |
| `SUPPORT_TO` | Support portal inbox (optional, falls back to `CONTACT_TO`) | `support@yourdomain.com` |
| `TURNSTILE_SECRET_KEY` | Spam protection (optional) | `0x4AAA…` |

Store keys as **Secret** (encrypted). Never write them into a file that goes to GitHub.

---

## 4. Payments (Stripe)

Customers pay on **Stripe Checkout**, Stripe's secure payment page. The cart sends the customer there, and Stripe returns them to `/order-success.html` after paying.

Card details are typed on Stripe's page, never on your site. Handling card numbers yourself would mean meeting the full PCI DSS security standard. With Stripe Checkout, Stripe carries that burden.

1. Create an account at [stripe.com](https://stripe.com). Start in **test mode**.
2. Copy the **secret key** (Developers → API keys) into `STRIPE_SECRET_KEY`.
3. Under Settings → Payment methods, turn on what you want: iDEAL, cards, Bancontact, and so on. The checkout shows whatever you enable there.
4. Test an order with card `4242 4242 4242 4242`, any future date and any CVC.
5. Under Settings → Customer emails, turn on **successful payment receipts**. Under your profile → Notifications, turn on **successful payments** so you're told about each order.
6. Orders, with the customer's delivery address and phone number, appear under **Payments** in the Stripe dashboard.
7. To go live, activate your account and replace the key with the `sk_live_…` key.

Delivery fee, free-delivery threshold and delivery countries are in `public/data/settings.js`.

---

## 5. E-mail (contact form and support portal)

The forms send e-mail through [Resend](https://resend.com), which has a free tier.

1. Create an account and **verify your domain** (`evrasmarthome.com`): Resend gives you DNS records to add in Cloudflare.
2. Create an API key and put it in `RESEND_API_KEY` (Secret). This is the only variable you must set.
3. The sender and inboxes are set in `public/data/settings.js` → `email`:
   - Contact form, general topics → `info@evrasmarthome.com`
   - Contact form, sales topics (quote, order question, business) → `satis@evrasmarthome.com`
   - Support portal → `destek@evrasmarthome.com`
   - Sender: `Evra <info@evrasmarthome.com>`
   Optional Cloudflare variables `CONTACT_TO`, `SALES_TO`, `SUPPORT_TO` and `MAIL_FROM` override these.
4. The three addresses must be able to receive mail: create them with your mail provider, or forward them to your own inbox with **Cloudflare → Email → Email Routing**.

What happens when someone submits a form:
- **Contact form.** You receive the message. Pressing *Reply* goes straight to the sender, and the sender gets an automatic confirmation.
- **Support portal.** A reference number such as `SR-261117-7KQ2` is created. You receive the full request, and the customer gets a confirmation with the reference number.

Until the keys are set, the forms show a friendly "not connected yet" message. To use another e-mail provider, only `sendEmail()` in `lib/email.js` needs to change.

---

## 6. Spam protection (recommended before launch)

The forms have a hidden spam trap, which stops simple bots. For proper protection, add **Cloudflare Turnstile**. It's free and mostly invisible.

1. Cloudflare dashboard → **Turnstile → Add widget**, for your domain.
2. Put the **site key** in `turnstileSiteKey` in `public/data/settings.js`.
3. Put the **secret key** in the `TURNSTILE_SECRET_KEY` variable.

This matters because the forms send an automatic reply to whatever address is typed in. Without Turnstile, someone could misuse that to send e-mails to strangers in your name.

---

## Before you go live

- [ ] All `[placeholders]` replaced (search for `[`)
- [ ] Real products, packages and prices in `catalog.js`
- [ ] Delivery settings checked in `settings.js`
- [ ] Privacy policy and terms written and checked
- [ ] Test order completed in Stripe test mode, then switched to the live key
- [ ] Contact and support forms tested, with both e-mails received
- [ ] Turnstile set up
- [ ] Video and photos added
