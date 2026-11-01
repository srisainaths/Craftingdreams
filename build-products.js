#!/usr/bin/env node
/*
  Crafting Dreams: builds one real page per product.

  Run this after you change index.html (products, prices, names, photos):
      node build-products.js
  then commit and push. It rewrites:
    - product/<slug>/index.html   one page per product (own link, title, WhatsApp/Google preview)
    - the no-JavaScript product list inside index.html
    - sitemap.xml

  Each product page is a copy of index.html that opens straight onto that product.
  This file is not part of the website (.vercelignore).
*/
const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const SITE = "https://craftingdreams.vercel.app";
const INDEX = path.join(ROOT, "index.html");
let html = fs.readFileSync(INDEX, "utf8");

/* ---- read PRODUCTS and CONFIG out of index.html ---- */
function grab(re, what) { const m = html.match(re); if (!m) throw new Error("Could not find " + what + " in index.html"); return m[1]; }
const imgVar = grab(/const IMG_VARAMALA = ("[^"]*");/, "IMG_VARAMALA");
const arr = grab(/const PRODUCTS = (\[[\s\S]*?\n\]);/, "PRODUCTS");
const whatsapp = grab(/whatsapp:\s*"(\d+)"/, "CONFIG.whatsapp");
const shopName = grab(/shopName:\s*"([^"]+)"/, "CONFIG.shopName");
const PRODUCTS = new Function("IMG_VARAMALA", "return " + arr)(JSON.parse(imgVar));
const SIZED = ["Resin Frames", "Varamala Preservation Teakwood Frames"];

const seen = new Set();
for (const p of PRODUCTS) {
  if (!p.slug || !/^[a-z0-9-]+$/.test(p.slug)) throw new Error("Product " + p.id + " needs a slug (lowercase letters, numbers, hyphens)");
  if (seen.has(p.slug)) throw new Error("Duplicate slug: " + p.slug);
  seen.add(p.slug);
}

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const inr = (n) => "₹" + n.toLocaleString("en-IN");
const priceText = (p) => (SIZED.includes(p.cat) ? "From " : "") + inr(p.price);
const url = (p) => `/product/${p.slug}/`;
const waLink = (p) => `https://wa.me/${whatsapp}?text=${encodeURIComponent(`Hi ${shopName}! I would like to order: ${p.name} (${priceText(p)})`)}`;
const abs = (img) => SITE + "/" + (img || "images/share.jpg").replace(/^\//, "");

/* ---- 1. the no-JavaScript list on the home page ---- */
const nsItem = (p) =>
  `<li class="nsc">${p.thumb || p.image ? `<img src="${esc(p.thumb || p.image)}" alt="${esc(p.name)}" width="560" height="560" loading="lazy">` : ""}` +
  `<b><a href="${url(p)}" style="background:none;color:inherit;padding:0;text-align:left">${esc(p.name)}</a></b><span>${esc(p.tagline || "")}</span><em>${priceText(p)}</em>` +
  `<a href="${waLink(p)}">Order on WhatsApp</a></li>`;
const visible = PRODUCTS.filter((p) => p.image || p.thumb);
html = html.replace(/<ul class="nsl">[\s\S]*?<\/ul>/, () => `<ul class="nsl">\n${visible.map(nsItem).join("\n")}\n</ul>`);
fs.writeFileSync(INDEX, html);

/* ---- 2. one page per product ---- */
const nsStyle = (html.match(/<noscript>\s*(<style>[\s\S]*?<\/style>)/) || [])[1] || "";
fs.rmSync(path.join(ROOT, "product"), { recursive: true, force: true });

function shortDesc(p) {
  const first = (p.tagline ? p.tagline + ". " : "") + (p.desc || "");
  return first.length > 158 ? first.slice(0, 155).replace(/\s+\S*$/, "") + "..." : first;
}
function swap(page, re, to, what) {
  if (!re.test(page)) throw new Error("Template tag not found: " + what);
  return page.replace(re, () => to);
}

for (const p of PRODUCTS) {
  const title = `${p.name} | ${shopName}`;
  const desc = shortDesc(p);
  const link = SITE + url(p);
  let page = html;
  page = swap(page, /<title>[\s\S]*?<\/title>/, `<title>${esc(title)}</title>`, "title");
  page = swap(page, /<meta name="description" content="[^"]*">/, `<meta name="description" content="${esc(desc)}">`, "description");
  page = swap(page, /<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${link}">`, "canonical");
  page = swap(page, /<meta property="og:type" content="[^"]*">/, `<meta property="og:type" content="product">`, "og:type");
  page = swap(page, /<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${esc(p.name)}">`, "og:title");
  page = swap(page, /<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${esc(desc)}">`, "og:description");
  page = swap(page, /<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${link}">`, "og:url");
  page = swap(page, /<meta property="og:image" content="[^"]*">/, `<meta property="og:image" content="${abs(p.image)}">`, "og:image");
  page = swap(page, /<meta property="og:image:width" content="\d+">\s*<meta property="og:image:height" content="\d+">/, "", "og:image size");
  const ld = {
    "@context": "https://schema.org", "@type": "Product", name: p.name, description: p.desc, image: abs(p.image), category: p.cat,
    brand: { "@type": "Brand", name: shopName },
    offers: { "@type": "Offer", priceCurrency: "INR", price: p.price, availability: "https://schema.org/InStock", url: link },
  };
  const head =
    `<base href="/">\n<script>window.CD_PRODUCT=${JSON.stringify(p.slug)};document.documentElement.classList.add("pp");</script>\n` +
    `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>`;
  page = swap(page, /<meta charset="utf-8">/, `<meta charset="utf-8">\n${head}`, "charset");
  const ns =
    `<noscript>\n${nsStyle}\n<div class="nsw"><p><a href="/">&larr; All products</a></p><h1>${esc(p.name)}</h1>` +
    `${p.image ? `<p><img src="${esc(p.image)}" alt="${esc(p.name)}" style="max-width:420px;width:100%;border-radius:18px"></p>` : ""}` +
    `<p>${esc(p.desc)}</p><p><b>${priceText(p)}</b></p>${SIZED.includes(p.cat) ? "<p>Available in 8, 9, 10, 11 and 12 inch.</p>" : ""}` +
    `<p><a href="${waLink(p)}" style="display:inline-block;background:#1D8A3B;color:#fff;text-decoration:none;border-radius:99px;padding:12px 22px;font-weight:600">Order on WhatsApp</a></p></div>\n</noscript>`;
  page = swap(page, /<noscript>[\s\S]*?<\/noscript>/, ns, "noscript");
  const dir = path.join(ROOT, "product", p.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page);
}

/* ---- 3. sitemap ---- */
const today = new Date().toISOString().slice(0, 10);
const urls = [{ loc: SITE + "/", pr: "1.0", cf: "weekly" }, ...PRODUCTS.map((p) => ({ loc: SITE + url(p), pr: "0.7", cf: "monthly" }))];
fs.writeFileSync(
  path.join(ROOT, "sitemap.xml"),
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls.map((u) => `  <url>\n    <loc>${u.loc}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>${u.cf}</changefreq>\n    <priority>${u.pr}</priority>\n  </url>`).join("\n") +
    `\n</urlset>\n`
);
console.log(`Built ${PRODUCTS.length} product pages and the sitemap.`);
