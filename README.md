# Crafting Dreams website

Handmade resin keepsake shop. A single static page (`index.html` + `images/`), hosted on Vercel.

- **Login, orders, prices, coupons:** Firebase (Google sign-in + Firestore). Paste the web app config into `FIREBASE` in `index.html`. With `apiKey` empty the shop runs without login or coupons.
- **Payments:** Razorpay checkout. Set `CONFIG.razorpayKey` (use `rzp_live_...` to go live).
- **WhatsApp:** set `CONFIG.whatsapp` (country code + number, no `+`).
- **Security rules:** `firestore.rules` → paste into Firebase console › Firestore › Rules. Not deployed to the website (see `.vercelignore`).

Order totals are calculated in the browser. Check the Razorpay dashboard amount before fulfilling an order.

## Product pages

Every product has its own page at `/product/<slug>/`. The pages are generated from the product list in `index.html`.
After you change a product (name, price, photo, description), run:

    node build-products.js

then commit the changes, including the `product/` folder and `sitemap.xml`. Each product needs a unique `slug` in `index.html`.

Frames and varamala art have size choices (8 to 12 inch), set by `SIZED_CATS` and `SIZES` in `index.html`.

## Shipping rates

Shipping is added at checkout from the delivery PIN code and the packed weight of the order. `SHIPPING` in `index.html` has, for each zone,
a base charge and a charge per kg, plus the PIN ranges (first three digits). Piece weights are `kg` on each size in `TIERS`, and `DEFAULT_KG` for pieces without sizes.
Change the numbers there, then commit and push.
