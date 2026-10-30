# Crafting Dreams website

Handmade resin keepsake shop. A single static page (`index.html` + `images/`), hosted on Vercel.

- **Login, orders, prices, coupons:** Firebase (Google sign-in + Firestore). Paste the web app config into `FIREBASE` in `index.html`. With `apiKey` empty the shop runs without login or coupons.
- **Payments:** Razorpay checkout. Set `CONFIG.razorpayKey` (use `rzp_live_...` to go live).
- **WhatsApp:** set `CONFIG.whatsapp` (country code + number, no `+`).
- **Security rules:** `firestore.rules` → paste into Firebase console › Firestore › Rules. Not deployed to the website (see `.vercelignore`).

Order totals are calculated in the browser. Check the Razorpay dashboard amount before fulfilling an order.
