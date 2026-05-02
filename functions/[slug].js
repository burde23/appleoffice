// functions/[slug].js
// Sirve la página HTML de producto para rutas como /funda-silicona-negra

const RESERVED = ['admin', 'api', 'index', 'producto', 'media', 'favicon', 'functions'];

function slugify(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const APPLE_SVG = `<svg viewBox="0 0 170 170" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.197-2.12-9.973-3.17-14.34-3.17-4.58 0-9.492 1.05-14.746 3.17-5.262 2.13-9.501 3.24-12.742 3.35-4.929.21-9.842-1.96-14.746-6.52-3.13-2.73-7.045-7.41-11.735-14.04-5.032-7.08-9.169-15.29-12.41-24.65-3.471-10.11-5.211-19.9-5.211-29.378 0-10.857 2.346-20.221 7.045-28.068 3.693-6.303 8.606-11.275 14.755-14.925s12.793-5.51 19.948-5.629c3.915 0 9.049 1.211 15.429 3.591 6.362 2.388 10.447 3.599 12.238 3.599 1.339 0 5.877-1.416 13.57-4.239 7.275-2.617 13.415-3.7 18.445-3.275 13.63 1.1 23.87 6.473 30.68 16.153-12.19 7.386-18.22 17.731-18.1 31.002.11 10.337 3.86 18.939 11.23 25.769 3.34 3.17 7.07 5.62 11.22 7.36-.9 2.61-1.85 5.11-2.86 7.51zM119.11 7.24c0 8.102-2.96 15.667-8.86 22.669-7.12 8.324-15.732 13.134-25.071 12.375a25.222 25.222 0 0 1-.188-3.07c0-7.778 3.386-16.102 9.399-22.908 3.002-3.446 6.82-6.311 11.45-8.597 4.62-2.252 8.99-3.497 13.1-3.71.12 1.017.17 2.035.17 3.041z"/></svg>`;

export async function onRequestGet({ params, env }) {
  const slug = params.slug;
  if (RESERVED.includes(slug) || slug.includes('.')) {
    return new Response(null, { status: 404 });
  }

  try {
    const { results } = await env.DB
      .prepare('SELECT * FROM products WHERE active = 1 ORDER BY id ASC')
      .all();

    const product = results.find(p => slugify(p.name) === slug);
    if (!product) return new Response(notFoundHTML(), { status: 404, headers: { 'Content-Type': 'text/html;charset=UTF-8' } });

    const p = {
      ...product,
      low:       product.low    === 1,
      ars:       product.ars       ?? null,
      ars_old:   product.ars_old   ?? null,
      img:       product.img       ?? null,
      offer_end: product.offer_end ?? null,
    };

    const f = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
    const pct = p.ars && p.ars_old ? Math.round((1 - p.ars / p.ars_old) * 100) : null;
    const catLabels = { equipos: 'Equipos', accesorios: 'Accesorios', cargadores: 'Cargadores', combos: 'Combos' };
    const cat = catLabels[p.cat] || p.cat;

    const html = `<!DOCTYPE html>
<html lang="es" dir="ltr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${p.name} — iPhone Zone</title>
<meta name="description" content="${p.stor ? p.stor + ' · ' : ''}iPhone Zone · La Plata, Argentina">
<meta property="og:title" content="${p.name} — iPhone Zone">
<meta property="og:description" content="${p.stor || ''}">
${p.img ? `<meta property="og:image" content="${p.img}">` : ''}
<style>
:root{
  --bg:#fafafa;--bg2:#f5f5f7;--bg3:#ffffff;--bg4:#f0f0f2;
  --border:rgba(0,0,0,0.07);--border2:rgba(0,0,0,0.13);--border3:rgba(0,0,0,0.20);
  --ink:#1d1d1f;--ink-mid:#6e6e73;--ink-dim:#a1a1a6;--ink-faint:#d1d1d6;
  --silver:#8e8e93;--accent:#3a3a3c;
  --green:#1a8a3a;--green-l:#30d158;--red:#c0392b;--amber:#b8600a;--amber-l:#ff9f0a;
  --blue:#2997ff;
  --ease:cubic-bezier(0.25,0.1,0.25,1);
  --spring:cubic-bezier(0.34,1.56,0.64,1);
  --font:-apple-system,'SF Pro Display','Helvetica Neue',Helvetica,Arial,sans-serif;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth;font-size:16px;background:var(--bg)}
body{font-family:var(--font);color:var(--ink);-webkit-font-smoothing:antialiased;overflow-x:hidden;line-height:1.6}
img{display:block;max-width:100%}
a{text-decoration:none;color:inherit}
button{border:none;cursor:pointer;font-family:inherit;background:none}

/* ── SCROLL BAR ── */
#scroll-bar{position:fixed;top:0;left:0;height:1px;background:var(--ink);width:0%;z-index:9999;transition:width .1s linear}

/* ── NAV — idéntico al index ── */
#nav{
  position:fixed;top:0;left:0;right:0;z-index:900;
  height:56px;display:flex;align-items:center;justify-content:space-between;
  padding:0 48px;
  background:rgba(250,250,250,0.85);
  backdrop-filter:blur(20px) saturate(180%);
  -webkit-backdrop-filter:blur(20px) saturate(180%);
  border-bottom:1px solid var(--border);
  transition:background .3s,border-color .3s;
}
.nav-brand{font-family:var(--font);font-size:13px;font-weight:400;letter-spacing:.22em;text-transform:uppercase;color:var(--ink);line-height:1;display:flex;align-items:center;gap:9px}
.nav-apple-logo{width:18px;height:18px;fill:var(--ink);flex-shrink:0;display:block;position:relative;top:-1px}
.nav-brand-text{display:flex;align-items:center;gap:0}
.nav-brand-iphone{font-weight:500;letter-spacing:.22em;color:var(--ink-mid)}
.nav-brand-zone{font-weight:700;letter-spacing:.22em;color:var(--ink)}
.nav-links{display:flex;gap:32px}
.nav-links a{font-size:12px;color:var(--ink-mid);transition:color .2s;letter-spacing:.06em;text-transform:uppercase;font-weight:400}
.nav-links a:hover{color:var(--ink)}
.nav-actions{display:flex;align-items:center;gap:8px}
.nav-cart{position:relative;width:38px;height:38px;display:flex;align-items:center;justify-content:center;border-radius:0;transition:background .2s}
.nav-cart:hover{background:rgba(0,0,0,0.04)}
.nav-cart svg{width:18px;height:18px;stroke:var(--ink);fill:none;stroke-width:1.4}
#cart-count{position:absolute;top:5px;right:5px;background:var(--ink);color:#fff;font-size:8px;font-weight:600;width:14px;height:14px;border-radius:50%;display:flex;align-items:center;justify-content:center;opacity:0;transform:scale(0);transition:all .3s var(--spring)}
#cart-count.show{opacity:1;transform:scale(1)}
.nav-back-btn{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--ink-mid);letter-spacing:.04em;text-transform:uppercase;transition:color .2s;padding:8px 0}
.nav-back-btn:hover{color:var(--ink)}
.nav-back-btn svg{width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round;transition:transform .2s}
.nav-back-btn:hover svg{transform:translateX(-2px)}

/* Mobile nav */
@media(max-width:768px){
  #nav{padding:0 20px}
  .nav-links{display:none}
  .nav-back-btn span{display:none}
}

/* ── BREADCRUMB ── */
.breadcrumb{
  margin-top:56px;padding:12px 48px;
  font-size:11px;color:var(--ink-dim);display:flex;align-items:center;gap:6px;
  border-bottom:1px solid var(--border);letter-spacing:.03em;
}
.breadcrumb a{color:var(--ink-dim);transition:color .2s}
.breadcrumb a:hover{color:var(--ink)}
.bc-sep{opacity:.35;font-size:10px}
@media(max-width:768px){.breadcrumb{padding:10px 20px}}

/* ── MAIN LAYOUT ── */
.prod-page{
  max-width:1160px;margin:0 auto;
  padding:56px 48px 120px;
  display:grid;grid-template-columns:1fr 1fr;
  gap:80px;align-items:start;
}
@media(max-width:960px){.prod-page{gap:48px;padding:40px 28px 80px}}
@media(max-width:700px){.prod-page{grid-template-columns:1fr;gap:32px;padding:28px 20px 72px}}

/* ── LEFT — IMAGEN ── */
.prod-media{position:sticky;top:72px}

.prod-img-frame{
  width:100%;aspect-ratio:1/1;
  background:var(--bg2);
  border:1px solid var(--border);
  overflow:hidden;position:relative;
  display:flex;align-items:center;justify-content:center;
}
.prod-img-frame img{
  width:100%;height:100%;object-fit:cover;
  transition:transform .6s var(--ease);
}
.prod-img-frame:hover img{transform:scale(1.03)}
.prod-img-ph{
  display:flex;flex-direction:column;align-items:center;gap:16px;
  opacity:.12;
}
.prod-img-ph svg{width:80px;height:80px;fill:var(--ink)}
.prod-img-ph-text{font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase}

/* Badge flotante */
.prod-float-badge{
  position:absolute;top:16px;left:16px;
  padding:5px 12px;
  font-size:10px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;
  backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);
}
.b-sale .prod-float-badge{background:rgba(41,151,255,.12);color:var(--blue);border:1px solid rgba(41,151,255,.2)}
.b-new  .prod-float-badge{background:rgba(26,138,58,.1);color:var(--green);border:1px solid rgba(26,138,58,.2)}
.b-pop  .prod-float-badge{background:rgba(29,29,31,.06);color:var(--ink);border:1px solid rgba(29,29,31,.12)}

/* Miniaturas (decorativas, por ahora solo 1 imagen) */
.prod-thumbs{display:flex;gap:8px;margin-top:12px}
.prod-thumb{
  width:60px;height:60px;border:1px solid var(--border);
  overflow:hidden;cursor:pointer;transition:border-color .2s;flex-shrink:0;
}
.prod-thumb.active{border-color:var(--ink)}
.prod-thumb img{width:100%;height:100%;object-fit:cover}

/* ── RIGHT — INFO ── */
.prod-info{}

.prod-eyebrow{
  font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;
  color:var(--ink-dim);margin-bottom:10px;
  display:flex;align-items:center;gap:8px;
}
.prod-eyebrow::before{content:'';width:20px;height:1px;background:var(--ink-faint);display:inline-block}

.prod-title{
  font-size:38px;font-weight:600;letter-spacing:-.6px;line-height:1.12;
  margin-bottom:12px;color:var(--ink);
}
@media(max-width:960px){.prod-title{font-size:30px}}
@media(max-width:700px){.prod-title{font-size:26px}}

.prod-stor{
  font-size:16px;color:var(--ink-mid);
  margin-bottom:28px;line-height:1.55;font-weight:300;
}

.prod-divider{width:40px;height:1px;background:var(--border2);margin-bottom:28px}

/* ── PRECIO ── */
.prod-price-block{margin-bottom:6px}
.prod-price-label{font-size:10px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-dim);margin-bottom:8px}
.prod-price{
  font-size:42px;font-weight:300;letter-spacing:-.8px;
  color:var(--ink);line-height:1;margin-bottom:6px;
}
@media(max-width:960px){.prod-price{font-size:34px}}
.prod-price-old{
  font-size:16px;color:var(--ink-dim);text-decoration:line-through;
  font-weight:300;display:inline-block;margin-right:10px;
}
.prod-discount-tag{
  display:inline-block;padding:3px 10px;
  font-size:11px;font-weight:700;letter-spacing:.05em;
  background:rgba(26,138,58,.1);color:var(--green);
  border:1px solid rgba(26,138,58,.15);
  vertical-align:middle;
}
.prod-saving{font-size:13px;color:var(--green);margin-top:8px;font-weight:500}
.prod-consult{font-size:20px;color:var(--ink-mid);font-weight:300;letter-spacing:-.2px}

/* ── COUNTDOWN ── */
.prod-cd{
  margin:28px 0;
  border:1px solid rgba(184,96,10,.15);
  background:rgba(184,96,10,.03);
  padding:20px 24px;
}
.prod-cd-top{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.prod-cd-icon{font-size:14px}
.prod-cd-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:var(--amber)}
.prod-cd-units{display:flex;align-items:center;gap:0}
.prod-cd-unit{display:flex;flex-direction:column;align-items:center;padding:0 16px;border-right:1px solid var(--border)}
.prod-cd-unit:first-child{padding-left:0}
.prod-cd-unit:last-child{border-right:none}
.prod-cd-n{font-size:32px;font-weight:300;letter-spacing:-.5px;color:var(--ink);line-height:1;font-variant-numeric:tabular-nums;min-width:44px;text-align:center}
.prod-cd-l{font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-dim);margin-top:4px}
@media(max-width:480px){.prod-cd-n{font-size:24px}.prod-cd-unit{padding:0 10px}}

/* ── STOCK ── */
.prod-stock-row{
  display:flex;align-items:center;gap:8px;
  font-size:13px;color:var(--ink-mid);
  margin-bottom:28px;padding:12px 0;
  border-top:1px solid var(--border);border-bottom:1px solid var(--border);
}
.stock-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;position:relative}
.stock-dot.ok{background:var(--green-l)}
.stock-dot.low{background:var(--amber-l)}
.stock-dot.ok::after{
  content:'';position:absolute;inset:-3px;border-radius:50%;
  border:1px solid rgba(48,209,88,.3);
  animation:pulse-stock 2s ease-in-out infinite;
}
@keyframes pulse-stock{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0;transform:scale(1.6)}}

/* ── CTA ── */
.prod-cta{display:flex;flex-direction:column;gap:10px;margin-bottom:28px}

.btn-add-cart{
  display:flex;align-items:center;justify-content:center;gap:10px;
  width:100%;padding:17px 24px;
  background:var(--ink);color:white;
  font-size:14px;font-weight:500;letter-spacing:.02em;
  border:none;cursor:pointer;
  transition:background .25s,transform .1s;
  position:relative;overflow:hidden;
}
.btn-add-cart::after{
  content:'';position:absolute;inset:0;background:white;opacity:0;transition:opacity .2s;
}
.btn-add-cart:hover{background:var(--accent)}
.btn-add-cart:active{transform:scale(.99)}
.btn-add-cart svg{width:16px;height:16px;stroke:white;fill:none;stroke-width:1.5;flex-shrink:0}
.btn-add-cart.added{background:var(--green)}

.btn-see-store{
  display:flex;align-items:center;justify-content:center;gap:8px;
  width:100%;padding:15px 24px;
  border:1px solid var(--border2);
  color:var(--ink-mid);font-size:13px;font-weight:500;letter-spacing:.02em;
  transition:all .2s;background:none;cursor:pointer;
}
.btn-see-store:hover{border-color:var(--border3);color:var(--ink);background:var(--bg2)}
.btn-see-store svg{width:13px;height:13px;stroke:currentColor;fill:none;stroke-width:1.5;opacity:.6}

/* ── FEATURES ── */
.prod-features{
  display:grid;grid-template-columns:1fr 1fr;gap:0;
  border:1px solid var(--border);margin-bottom:28px;
}
.prod-feat{
  padding:16px 18px;border-bottom:1px solid var(--border);border-right:1px solid var(--border);
}
.prod-feat:nth-child(even){border-right:none}
.prod-feat:nth-last-child(-n+2){border-bottom:none}
.prod-feat-icon{font-size:18px;margin-bottom:6px;display:block}
.prod-feat-label{font-size:10px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-dim);margin-bottom:2px}
.prod-feat-val{font-size:13px;color:var(--ink);font-weight:500}

/* ── RELATED ── */
.related-section{
  max-width:1160px;margin:0 auto;
  padding:0 48px 80px;
  border-top:1px solid var(--border);
  padding-top:56px;
}
@media(max-width:768px){.related-section{padding:40px 20px 60px}}
.related-eyebrow{font-size:10px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--ink-dim);margin-bottom:6px}
.related-title{font-size:26px;font-weight:600;letter-spacing:-.4px;margin-bottom:32px}
.related-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1px;background:var(--border)}
.related-card{background:var(--bg3);padding:20px;transition:background .2s;cursor:pointer}
.related-card:hover{background:var(--bg2)}
.related-card-img{width:100%;aspect-ratio:1;object-fit:cover;background:var(--bg2);margin-bottom:12px}
.related-card-img-ph{width:100%;aspect-ratio:1;background:var(--bg2);display:flex;align-items:center;justify-content:center;font-size:32px;opacity:.3;margin-bottom:12px}
.related-card-cat{font-size:9px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-dim);margin-bottom:4px}
.related-card-name{font-size:13px;font-weight:500;color:var(--ink);margin-bottom:4px;line-height:1.3}
.related-card-price{font-size:13px;color:var(--ink-mid)}

/* ── CART ── */
.cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:800;opacity:0;pointer-events:none;transition:opacity .25s;backdrop-filter:blur(2px);-webkit-backdrop-filter:blur(2px)}
.cart-overlay.open{opacity:1;pointer-events:all}
.cart-panel{
  position:fixed;top:0;right:-440px;bottom:0;width:420px;
  background:var(--bg3);z-index:801;
  transition:right .36s cubic-bezier(.22,1,.36,1);
  display:flex;flex-direction:column;
  box-shadow:-4px 0 40px rgba(0,0,0,.1);
}
.cart-panel.open{right:0}
@media(max-width:520px){.cart-panel{width:100%;right:-100%}}
.cart-hdr{
  padding:18px 22px;border-bottom:1px solid var(--border);
  display:flex;align-items:center;justify-content:space-between;flex-shrink:0;
}
.cart-hdr-title{font-size:14px;font-weight:600;letter-spacing:-.1px}
.cart-close{
  width:28px;height:28px;border:1px solid var(--border2);
  display:flex;align-items:center;justify-content:center;
  font-size:16px;color:var(--ink-mid);cursor:pointer;transition:all .2s;
}
.cart-close:hover{border-color:var(--border3);color:var(--ink)}
.cart-body{flex:1;overflow-y:auto;padding:0}
.cart-empty-wrap{padding:60px 20px;text-align:center}
.cart-empty-icon{font-size:40px;opacity:.2;margin-bottom:12px}
.cart-empty-text{font-size:14px;color:var(--ink-dim);font-style:italic}
.cart-item{display:flex;gap:14px;padding:16px 22px;border-bottom:1px solid var(--border);transition:background .15s}
.cart-item:hover{background:var(--bg2)}
.cart-item-img{width:52px;height:52px;object-fit:cover;border:1px solid var(--border);flex-shrink:0}
.cart-item-img-ph{width:52px;height:52px;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0}
.cart-item-info{flex:1;min-width:0}
.cart-item-name{font-size:13px;font-weight:500;color:var(--ink);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cart-item-stor{font-size:11px;color:var(--ink-dim);margin-bottom:6px}
.cart-item-bot{display:flex;align-items:center;justify-content:space-between}
.cart-item-price{font-size:13px;color:var(--ink-mid)}
.cart-qty{display:flex;align-items:center;gap:0;border:1px solid var(--border2)}
.cart-qty-btn{width:28px;height:28px;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--ink-mid);transition:all .2s;cursor:pointer}
.cart-qty-btn:hover{background:var(--bg2);color:var(--ink)}
.cart-qty-n{font-size:12px;font-weight:600;min-width:28px;text-align:center;border-left:1px solid var(--border2);border-right:1px solid var(--border2);height:28px;display:flex;align-items:center;justify-content:center}
.btn-rm{color:var(--ink-faint);font-size:16px;cursor:pointer;transition:color .2s;padding:4px;display:flex;align-items:center}
.btn-rm:hover{color:var(--red)}
.cart-foot{padding:20px 22px;border-top:1px solid var(--border);flex-shrink:0;background:var(--bg3)}
.cart-subtotal{display:flex;justify-content:space-between;font-size:11px;color:var(--ink-dim);margin-bottom:6px;text-transform:uppercase;letter-spacing:.06em}
.cart-total-row{display:flex;justify-content:space-between;font-size:16px;font-weight:600;margin-bottom:18px}
.btn-checkout{
  width:100%;padding:15px;
  background:var(--ink);color:white;
  font-size:14px;font-weight:500;
  border:none;cursor:pointer;transition:background .2s;letter-spacing:.01em;
}
.btn-checkout:hover{background:var(--accent)}

/* ── TOAST ── */
.toast{
  position:fixed;bottom:32px;left:50%;
  transform:translateX(-50%) translateY(12px);
  background:var(--ink);color:white;
  padding:12px 24px;font-size:13px;font-weight:500;
  z-index:9999;opacity:0;
  transition:all .35s cubic-bezier(.22,1,.36,1);
  pointer-events:none;white-space:nowrap;
  box-shadow:0 6px 28px rgba(0,0,0,.18);
  letter-spacing:.01em;
}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
.toast.success{background:var(--green)}
</style>
</head>
<body>

<div id="scroll-bar"></div>

<!-- NAV — idéntico al index -->
<nav id="nav">
  <a href="/" class="nav-brand">
    ${APPLE_SVG}
    <span class="nav-brand-text">
      <span class="nav-brand-iphone">iPhone</span><span class="nav-brand-zone">Zone</span>
    </span>
  </a>
  <ul class="nav-links">
    <li><a href="/#prods">Productos</a></li>
    <li><a href="/#cats">Categorías</a></li>
    <li><a href="/#offer">Ofertas</a></li>
    <li><a href="/#features">Nosotros</a></li>
    <li><a href="/#about">Contacto</a></li>
  </ul>
  <div class="nav-actions">
    <button class="nav-cart" id="cart-btn" aria-label="Abrir carrito" onclick="openCart()">
      <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
      <span id="cart-count">0</span>
    </button>
  </div>
</nav>

<!-- BREADCRUMB -->
<div class="breadcrumb">
  <a href="/">Inicio</a>
  <span class="bc-sep">›</span>
  <a href="/#prods">${cat}</a>
  <span class="bc-sep">›</span>
  <span>${p.name}</span>
</div>

<!-- PRODUCTO -->
<div class="prod-page">

  <!-- LEFT: imagen -->
  <div class="prod-media">
    <div class="prod-img-frame ${p.badge}">
      ${p.img
        ? `<img src="${p.img}" alt="${p.name}" id="mainImg">`
        : `<div class="prod-img-ph">
            <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
            <span class="prod-img-ph-text">Sin imagen</span>
           </div>`
      }
      <span class="prod-float-badge">${p.btxt}</span>
    </div>
    ${p.img ? `
    <div class="prod-thumbs">
      <div class="prod-thumb active"><img src="${p.img}" alt="${p.name}"></div>
    </div>` : ''}
  </div>

  <!-- RIGHT: info -->
  <div class="prod-info">
    <div class="prod-eyebrow">${cat}</div>
    <h1 class="prod-title">${p.name}</h1>
    ${p.stor ? `<p class="prod-stor">${p.stor}</p>` : ''}
    <div class="prod-divider"></div>

    <!-- Precio -->
    <div class="prod-price-block">
      <div class="prod-price-label">Precio</div>
      ${p.ars ? `
        <div class="prod-price">${f(p.ars)}</div>
        ${p.ars_old ? `
        <div style="margin-top:8px">
          <span class="prod-price-old">${f(p.ars_old)}</span>
          ${pct ? `<span class="prod-discount-tag">−${pct}%</span>` : ''}
        </div>
        ${pct ? `<div class="prod-saving">Ahorrás ${f(p.ars_old - p.ars)}</div>` : ''}
        ` : ''}
      ` : `<div class="prod-consult">Consultá el precio</div>`}
    </div>

    <!-- Countdown -->
    ${p.offer_end ? `
    <div class="prod-cd">
      <div class="prod-cd-top">
        <span class="prod-cd-icon">⏱</span>
        <span class="prod-cd-label">Oferta termina en</span>
      </div>
      <div class="prod-cd-units">
        <div class="prod-cd-unit"><span class="prod-cd-n" id="pcd-d">00</span><span class="prod-cd-l">Días</span></div>
        <div class="prod-cd-unit"><span class="prod-cd-n" id="pcd-h">00</span><span class="prod-cd-l">Horas</span></div>
        <div class="prod-cd-unit"><span class="prod-cd-n" id="pcd-m">00</span><span class="prod-cd-l">Min</span></div>
        <div class="prod-cd-unit"><span class="prod-cd-n" id="pcd-s">00</span><span class="prod-cd-l">Seg</span></div>
      </div>
    </div>` : ''}

    <!-- Stock -->
    <div class="prod-stock-row">
      <span class="stock-dot ${p.low ? 'low' : 'ok'}"></span>
      <span>${p.stock_label || (p.low ? 'Stock limitado — apurate' : 'En stock')}</span>
    </div>

    <!-- CTA -->
    <div class="prod-cta">
      ${p.ars ? `
      <button class="btn-add-cart" id="btnAdd" onclick="addToCart()">
        <svg viewBox="0 0 24 24"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        Agregar al carrito
      </button>` : ''}
      ${p.url ? `
      <a href="${p.url}" target="_blank" class="btn-see-store">
        Ver en tienda online
        <svg viewBox="0 0 24 24"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
      </a>` : ''}
    </div>

    <!-- Features -->
    <div class="prod-features">
      <div class="prod-feat">
        <span class="prod-feat-icon">📦</span>
        <div class="prod-feat-label">Envío</div>
        <div class="prod-feat-val">A todo el país</div>
      </div>
      <div class="prod-feat">
        <span class="prod-feat-icon">✅</span>
        <div class="prod-feat-label">Garantía</div>
        <div class="prod-feat-val">Respaldada</div>
      </div>
      <div class="prod-feat">
        <span class="prod-feat-icon">💳</span>
        <div class="prod-feat-label">Pago</div>
        <div class="prod-feat-val">MercadoPago</div>
      </div>
      <div class="prod-feat">
        <span class="prod-feat-icon">🔄</span>
        <div class="prod-feat-label">Canje</div>
        <div class="prod-feat-val">Tomamos tu equipo</div>
      </div>
    </div>

  </div>
</div>

<!-- RELACIONADOS -->
<div class="related-section" id="related-section">
  <div class="related-eyebrow">También te puede interesar</div>
  <div class="related-title">Más productos</div>
  <div class="related-grid" id="related-grid">
    <div style="padding:40px;color:var(--ink-dim);font-size:13px">Cargando…</div>
  </div>
</div>

<!-- CART SIDEBAR -->
<div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
<div class="cart-panel" id="cartPanel">
  <div class="cart-hdr">
    <div class="cart-hdr-title">Carrito</div>
    <button class="cart-close" onclick="closeCart()">×</button>
  </div>
  <div class="cart-body" id="cartBody"></div>
  <div class="cart-foot">
    <div class="cart-subtotal"><span>Subtotal</span><span id="cartSub">$0</span></div>
    <div class="cart-total-row"><span>Total</span><span id="cartTotal">$0</span></div>
    <button class="btn-checkout" onclick="goCheckout()">Ir al checkout →</button>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
/* ── Datos del producto ── */
const PRODUCT = ${JSON.stringify({ id: p.id, name: p.name, stor: p.stor || '', ars: p.ars, ars_old: p.ars_old, color: p.color, offer_end: p.offer_end, img: p.img, stock_label: p.stock_label, low: p.low })};
const f = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:0}).format(n);
function slugify(n){return n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');}

/* ── Scroll bar ── */
window.addEventListener('scroll',()=>{
  const pct=(window.scrollY/(document.documentElement.scrollHeight-window.innerHeight))*100;
  document.getElementById('scroll-bar').style.width=pct+'%';
},{passive:true});

/* ── Countdown ── */
${p.offer_end ? `
const offerEnd = new Date('${p.offer_end}');
function tickProd(){
  const diff=offerEnd-Date.now();
  const pad=n=>String(Math.max(0,Math.floor(n))).padStart(2,'0');
  ['d','h','m','s'].forEach(u=>{const el=document.getElementById('pcd-'+u);if(el)el.textContent='00';});
  if(diff<=0) return;
  document.getElementById('pcd-d').textContent=pad(diff/864e5);
  document.getElementById('pcd-h').textContent=pad(diff%864e5/36e5);
  document.getElementById('pcd-m').textContent=pad(diff%36e5/6e4);
  document.getElementById('pcd-s').textContent=pad(diff%6e4/1e3);
}
tickProd();setInterval(tickProd,1000);` : ''}

/* ── Cart ── */
let cart=[];
try{cart=JSON.parse(sessionStorage.getItem('iz_cart')||'[]');}catch{}
function saveCart(){sessionStorage.setItem('iz_cart',JSON.stringify(cart));}

function addToCart(){
  if(!PRODUCT.ars) return;
  const ex=cart.find(i=>i.id===PRODUCT.id);
  if(ex){ex.qty++;}else{cart.push({id:PRODUCT.id,name:PRODUCT.name,stor:PRODUCT.stor,ars:PRODUCT.ars,color:PRODUCT.color,img:PRODUCT.img,qty:1});}
  saveCart();renderCart();openCart();
  const btn=document.getElementById('btnAdd');
  if(btn){btn.classList.add('added');btn.textContent='✔ Agregado';setTimeout(()=>{btn.classList.remove('added');btn.innerHTML='<svg viewBox="0 0 24 24" style="width:16px;height:16px;stroke:white;fill:none;stroke-width:1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg> Agregar al carrito';},2000);}
  showToast('✔ Agregado al carrito','success');
}

function removeItem(id){cart=cart.filter(i=>i.id!==id);saveCart();renderCart();}
function changeQty(id,d){
  const item=cart.find(i=>i.id===id);if(!item)return;
  item.qty+=d;if(item.qty<=0){removeItem(id);return;}
  saveCart();renderCart();
}

function renderCart(){
  const body=document.getElementById('cartBody');
  const count=document.getElementById('cart-count');
  const total=cart.reduce((s,i)=>s+i.ars*i.qty,0);
  const units=cart.reduce((s,i)=>s+i.qty,0);
  count.textContent=units;count.classList.toggle('show',units>0);
  document.getElementById('cartTotal').textContent=f(total);
  document.getElementById('cartSub').textContent=f(total);
  if(!cart.length){body.innerHTML='<div class="cart-empty-wrap"><div class="cart-empty-icon">🛒</div><div class="cart-empty-text">Tu carrito está vacío</div></div>';return;}
  body.innerHTML=cart.map(i=>\`
    <div class="cart-item">
      \${i.img
        ?'<img class="cart-item-img" src="'+i.img+'" alt="'+i.name+'">'
        :'<div class="cart-item-img-ph">📦</div>'}
      <div class="cart-item-info">
        <div class="cart-item-name">\${i.name}</div>
        <div class="cart-item-stor">\${i.stor||''}</div>
        <div class="cart-item-bot">
          <div class="cart-item-price">\${f(i.ars)}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <div class="cart-qty">
              <button class="cart-qty-btn" onclick="changeQty(\${i.id},-1)">−</button>
              <span class="cart-qty-n">\${i.qty}</span>
              <button class="cart-qty-btn" onclick="changeQty(\${i.id},1)">+</button>
            </div>
            <button class="btn-rm" onclick="removeItem(\${i.id})">×</button>
          </div>
        </div>
      </div>
    </div>
  \`).join('');
}

function openCart(){document.getElementById('cartOverlay').classList.add('open');document.getElementById('cartPanel').classList.add('open');document.body.style.overflow='hidden';}
function closeCart(){document.getElementById('cartOverlay').classList.remove('open');document.getElementById('cartPanel').classList.remove('open');document.body.style.overflow='';}
function goCheckout(){saveCart();window.location.href='/#checkout';}

/* ── Toast ── */
let _tt;
function showToast(msg,type=''){
  const t=document.getElementById('toast');t.textContent=msg;t.className='toast show '+(type||'');
  clearTimeout(_tt);_tt=setTimeout(()=>t.classList.remove('show'),2800);
}

/* ── Relacionados ── */
async function loadRelated(){
  try{
    const r=await fetch('/api/products');const d=await r.json();
    if(!d.ok||!d.products.length) return;
    const others=d.products.filter(p=>p.id!==PRODUCT.id).slice(0,6);
    const grid=document.getElementById('related-grid');
    grid.innerHTML=others.map(p=>\`
      <a href="/\${slugify(p.name)}" class="related-card">
        \${p.img
          ?'<img class="related-card-img" src="'+p.img+'" alt="'+p.name+'" loading="lazy">'
          :'<div class="related-card-img-ph">📦</div>'}
        <div class="related-card-cat">\${({equipos:'Equipos',accesorios:'Accesorios',cargadores:'Cargadores',combos:'Combos'})[p.cat]||p.cat}</div>
        <div class="related-card-name">\${p.name}</div>
        <div class="related-card-price">\${p.ars?f(p.ars):'Consultá precio'}</div>
      </a>
    \`).join('');
  }catch(e){document.getElementById('related-section').style.display='none';}
}

renderCart();
loadRelated();
</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });

  } catch (err) {
    return new Response('Error interno', { status: 500 });
  }
}

function notFoundHTML() {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Producto no encontrado — iPhone Zone</title>
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <style>body{font-family:-apple-system,sans-serif;background:#fafafa;display:flex;align-items:center;justify-content:center;min-height:100vh;text-align:center;color:#1d1d1f}h1{font-size:24px;font-weight:600;margin-bottom:8px}p{color:#6e6e73;margin-bottom:24px}a{display:inline-block;padding:12px 24px;background:#1d1d1f;color:white;font-size:14px}</style>
  </head><body><div><h1>Producto no encontrado</h1><p>El producto que buscás no existe o fue eliminado.</p><a href="/">Volver al inicio</a></div></body></html>`;
}
