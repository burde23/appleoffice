// functions/[slug].js
// Sirve la página HTML de producto para rutas como /funda-silicona-negra
// Excluye rutas reservadas (admin, api, archivos estáticos)

const RESERVED = ['admin', 'api', 'index', 'producto', 'media', 'favicon'];

function slugify(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function onRequestGet({ params, env, request }) {
  const slug = params.slug;

  // Dejar pasar rutas reservadas o con extensión
  if (RESERVED.includes(slug) || slug.includes('.')) {
    return new Response(null, { status: 404 });
  }

  try {
    // Buscar el producto en D1
    const { results } = await env.DB
      .prepare('SELECT * FROM products WHERE active = 1 ORDER BY id ASC')
      .all();

    const product = results.find(p => slugify(p.name) === slug);
    if (!product) {
      return new Response(null, { status: 404 });
    }

    const p = {
      ...product,
      low:       product.low    === 1,
      ars:       product.ars       ?? null,
      ars_old:   product.ars_old   ?? null,
      img:       product.img       ?? null,
      offer_end: product.offer_end ?? null,
    };

    const arsFormat = n => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(n);
    const pct = p.ars && p.ars_old ? Math.round((1 - p.ars / p.ars_old) * 100) : null;

    const catLabels = { equipos: 'Equipos', accesorios: 'Accesorios', cargadores: 'Cargadores', combos: 'Combos' };

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${p.name} — iPhone Zone</title>
<meta name="description" content="${p.stor || p.name} · iPhone Zone">
<meta property="og:title" content="${p.name} — iPhone Zone">
<meta property="og:description" content="${p.stor || ''}">
${p.img ? `<meta property="og:image" content="${p.img}">` : ''}
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --ink:#1d1d1f;--ink-mid:#6e6e73;--ink-dim:#a1a1a6;
  --bg:#fafafa;--bg2:#f5f5f7;--border:rgba(0,0,0,0.08);--border2:rgba(0,0,0,0.14);
  --green:#1a8a3a;--green-l:#30d158;--red:#c0392b;--amber:#b8600a;
  --font:-apple-system,'SF Pro Display','Helvetica Neue',Helvetica,Arial,sans-serif;
}
html{font-size:16px;background:var(--bg)}
body{font-family:var(--font);color:var(--ink);-webkit-font-smoothing:antialiased;min-height:100vh}
a{text-decoration:none;color:inherit}
button{font-family:inherit;cursor:pointer;border:none;background:none}

/* NAV */
.nav{position:sticky;top:0;z-index:100;background:rgba(250,250,250,.88);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;padding:0 28px;height:52px}
.nav-brand{display:flex;align-items:center;gap:8px;font-size:15px;font-weight:600;letter-spacing:-.3px}
.nav-mark{width:28px;height:28px;background:var(--ink);display:flex;align-items:center;justify-content:center}
.nav-mark svg{width:14px;height:14px;fill:white}
.nav-back{display:flex;align-items:center;gap:6px;font-size:13px;color:var(--ink-mid);transition:color .2s}
.nav-back:hover{color:var(--ink)}
.nav-back svg{width:16px;height:16px}
.nav-cart-btn{display:flex;align-items:center;gap:6px;padding:7px 14px;border:1px solid var(--border2);font-size:13px;font-weight:500;color:var(--ink);transition:all .2s;background:none;cursor:pointer;position:relative}
.nav-cart-btn:hover{background:var(--bg2)}
.cart-dot{width:8px;height:8px;border-radius:50%;background:var(--ink);position:absolute;top:-3px;right:-3px;display:none}
.cart-dot.show{display:block}

/* BREADCRUMB */
.breadcrumb{padding:14px 28px;font-size:12px;color:var(--ink-dim);display:flex;align-items:center;gap:6px;border-bottom:1px solid var(--border)}
.breadcrumb a{color:var(--ink-dim);transition:color .2s}
.breadcrumb a:hover{color:var(--ink)}
.breadcrumb-sep{opacity:.4}

/* MAIN LAYOUT */
.prod-page{max-width:1100px;margin:0 auto;padding:48px 28px 80px;display:grid;grid-template-columns:1fr 1fr;gap:64px;align-items:start}
@media(max-width:780px){.prod-page{grid-template-columns:1fr;gap:32px;padding:28px 18px 60px}}

/* LEFT — imagen */
.prod-img-wrap{position:sticky;top:72px}
.prod-img-main{width:100%;aspect-ratio:1;background:var(--bg2);border:1px solid var(--border);display:flex;align-items:center;justify-content:center;overflow:hidden}
.prod-img-main img{width:100%;height:100%;object-fit:cover}
.prod-img-ph{font-size:80px;opacity:.15}
.prod-badge-img{display:inline-block;margin-top:14px;padding:5px 14px;font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase}
.b-sale{background:rgba(0,113,227,.1);color:#0071e3}
.b-new{background:rgba(26,138,58,.1);color:var(--green)}
.b-pop{background:rgba(var(--ink),.07);color:var(--ink)}

/* RIGHT — info */
.prod-info{}
.prod-eyebrow{font-size:11px;font-weight:500;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-dim);margin-bottom:10px}
.prod-title{font-size:32px;font-weight:600;letter-spacing:-.5px;line-height:1.15;margin-bottom:10px}
@media(max-width:780px){.prod-title{font-size:24px}}
.prod-stor{font-size:16px;color:var(--ink-mid);margin-bottom:24px;line-height:1.5}
.prod-rule{width:40px;height:1px;background:var(--border2);margin-bottom:24px}

/* Price */
.prod-price-block{margin-bottom:24px}
.prod-price{font-size:36px;font-weight:300;letter-spacing:-.5px;color:var(--ink);line-height:1}
@media(max-width:780px){.prod-price{font-size:28px}}
.prod-price-old{font-size:16px;color:var(--ink-dim);text-decoration:line-through;margin-top:6px}
.prod-discount{display:inline-block;margin-top:8px;padding:4px 12px;font-size:12px;font-weight:700;background:rgba(26,138,58,.1);color:var(--green);letter-spacing:.04em}
.prod-price-consult{font-size:20px;color:var(--ink-mid);font-style:italic;margin-top:6px}

/* Countdown */
.prod-cd-wrap{background:var(--bg2);border:1px solid var(--border);padding:16px 20px;margin-bottom:24px}
.prod-cd-label{font-size:10px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--amber);margin-bottom:10px}
.prod-cd{display:flex;gap:16px}
.prod-cd-unit{display:flex;flex-direction:column;align-items:center;gap:2px}
.prod-cd-n{font-size:28px;font-weight:300;letter-spacing:-.3px;color:var(--ink);line-height:1;min-width:36px;text-align:center}
.prod-cd-l{font-size:9px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--ink-dim)}

/* Stock */
.prod-stock{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink-mid);margin-bottom:28px}
.prod-stock-dot{width:8px;height:8px;border-radius:50%;flex-shrink:0}
.prod-stock-dot.ok{background:var(--green-l)}
.prod-stock-dot.low{background:var(--amber)}

/* CTA */
.btn-add-cart{width:100%;padding:16px;background:var(--ink);color:white;font-size:15px;font-weight:500;border:none;cursor:pointer;transition:background .2s;letter-spacing:.01em;margin-bottom:12px}
.btn-add-cart:hover{background:#3a3a3c}
.btn-add-cart:active{transform:scale(.99)}
.btn-see-online{width:100%;padding:14px;border:1px solid var(--border2);background:none;color:var(--ink-mid);font-size:14px;font-weight:500;cursor:pointer;transition:all .2s;display:block;text-align:center}
.btn-see-online:hover{border-color:var(--border2);color:var(--ink);background:var(--bg2)}

/* Cart sidebar */
.cart-overlay{position:fixed;inset:0;background:rgba(0,0,0,.35);z-index:800;opacity:0;pointer-events:none;transition:opacity .25s}
.cart-overlay.open{opacity:1;pointer-events:all}
.cart-panel{position:fixed;top:0;right:-420px;bottom:0;width:400px;background:white;z-index:801;transition:right .32s cubic-bezier(.22,1,.36,1);display:flex;flex-direction:column;box-shadow:-4px 0 32px rgba(0,0,0,.12)}
.cart-panel.open{right:0}
@media(max-width:480px){.cart-panel{width:100%;right:-100%}}
.cart-hdr{padding:20px 22px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;flex-shrink:0}
.cart-hdr-title{font-size:16px;font-weight:600}
.cart-close{width:30px;height:30px;border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:17px;color:var(--ink-mid);cursor:pointer;transition:all .2s}
.cart-close:hover{border-color:var(--border2);color:var(--ink)}
.cart-body{flex:1;overflow-y:auto;padding:16px 22px}
.cart-empty{padding:40px 0;text-align:center;color:var(--ink-dim);font-size:14px;font-style:italic}
.cart-item{display:flex;gap:12px;padding:14px 0;border-bottom:1px solid var(--border)}
.cart-item-info{flex:1}
.cart-item-name{font-size:13px;font-weight:500;color:var(--ink);margin-bottom:3px}
.cart-item-stor{font-size:11px;color:var(--ink-dim)}
.cart-item-price{font-size:13px;color:var(--ink-mid);margin-top:4px}
.cart-qty{display:flex;align-items:center;gap:8px;margin-top:8px}
.cart-qty-btn{width:26px;height:26px;border:1px solid var(--border2);display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;transition:all .2s;background:none}
.cart-qty-btn:hover{border-color:var(--border2);background:var(--bg2)}
.cart-qty-n{font-size:13px;font-weight:500;min-width:20px;text-align:center}
.btn-rm{color:var(--ink-dim);font-size:18px;cursor:pointer;transition:color .2s;padding:2px 6px}
.btn-rm:hover{color:var(--red)}
.cart-foot{padding:20px 22px;border-top:1px solid var(--border);flex-shrink:0}
.cart-total{display:flex;justify-content:space-between;font-size:15px;font-weight:600;margin-bottom:14px}
.btn-checkout{width:100%;padding:14px;background:var(--ink);color:white;font-size:14px;font-weight:500;border:none;cursor:pointer;transition:background .2s}
.btn-checkout:hover{background:#3a3a3c}

/* Toast */
.toast{position:fixed;bottom:28px;left:50%;transform:translateX(-50%) translateY(10px);background:var(--ink);color:white;padding:11px 22px;font-size:13px;font-weight:500;z-index:9999;opacity:0;transition:all .3s;pointer-events:none;box-shadow:0 4px 20px rgba(0,0,0,.2)}
.toast.show{opacity:1;transform:translateX(-50%) translateY(0)}
</style>
</head>
<body>

<nav class="nav">
  <a href="/" class="nav-back">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
    Volver
  </a>
  <a href="/" class="nav-brand">
    <div class="nav-mark"><svg viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg></div>
    iPhone Zone
  </a>
  <button class="nav-cart-btn" onclick="openCart()">
    🛒 Carrito
    <div class="cart-dot" id="cart-dot"></div>
  </button>
</nav>

<div class="breadcrumb">
  <a href="/">Inicio</a>
  <span class="breadcrumb-sep">›</span>
  <a href="/#prods">${catLabels[p.cat] || p.cat}</a>
  <span class="breadcrumb-sep">›</span>
  <span>${p.name}</span>
</div>

<div class="prod-page">
  <!-- Imagen -->
  <div class="prod-img-wrap">
    <div class="prod-img-main">
      ${p.img
        ? `<img src="${p.img}" alt="${p.name}">`
        : `<div class="prod-img-ph">📦</div>`
      }
    </div>
    <span class="prod-badge-img ${p.badge}">${p.btxt}</span>
  </div>

  <!-- Info -->
  <div class="prod-info">
    <div class="prod-eyebrow">${catLabels[p.cat] || p.cat}</div>
    <h1 class="prod-title">${p.name}</h1>
    <p class="prod-stor">${p.stor || ''}</p>
    <div class="prod-rule"></div>

    <!-- Precio -->
    <div class="prod-price-block">
      ${p.ars
        ? `<div class="prod-price">${arsFormat(p.ars)}</div>
           ${p.ars_old ? `<div class="prod-price-old">${arsFormat(p.ars_old)}</div>` : ''}
           ${pct ? `<span class="prod-discount">−${pct}% OFF</span>` : ''}`
        : `<div class="prod-price-consult">Consultá el precio</div>`
      }
    </div>

    <!-- Countdown si tiene offer_end -->
    ${p.offer_end ? `
    <div class="prod-cd-wrap" id="cdWrap">
      <div class="prod-cd-label">⏱ Oferta termina en</div>
      <div class="prod-cd">
        <div class="prod-cd-unit"><span class="prod-cd-n" id="pcd-d">00</span><span class="prod-cd-l">Días</span></div>
        <div class="prod-cd-unit"><span class="prod-cd-n" id="pcd-h">00</span><span class="prod-cd-l">Horas</span></div>
        <div class="prod-cd-unit"><span class="prod-cd-n" id="pcd-m">00</span><span class="prod-cd-l">Min</span></div>
        <div class="prod-cd-unit"><span class="prod-cd-n" id="pcd-s">00</span><span class="prod-cd-l">Seg</span></div>
      </div>
    </div>` : ''}

    <!-- Stock -->
    <div class="prod-stock">
      <div class="prod-stock-dot ${p.low ? 'low' : 'ok'}"></div>
      ${p.stock_label || (p.low ? 'Stock limitado' : 'En stock')}
    </div>

    <!-- CTA -->
    ${p.ars
      ? `<button class="btn-add-cart" onclick="addToCart()">Agregar al carrito</button>`
      : `<a href="${p.url || '/'}" target="_blank" class="btn-see-online">Ver en tienda online</a>`
    }
    ${p.url ? `<a href="${p.url}" target="_blank" class="btn-see-online">Ver en tienda externa ↗</a>` : ''}
  </div>
</div>

<!-- CART SIDEBAR -->
<div class="cart-overlay" id="cartOverlay" onclick="closeCart()"></div>
<div class="cart-panel" id="cartPanel">
  <div class="cart-hdr">
    <div class="cart-hdr-title">Tu carrito</div>
    <button class="cart-close" onclick="closeCart()">×</button>
  </div>
  <div class="cart-body" id="cartBody">
    <div class="cart-empty">Tu carrito está vacío</div>
  </div>
  <div class="cart-foot">
    <div class="cart-total"><span>Total</span><span id="cartTotal">$0</span></div>
    <button class="btn-checkout" onclick="goCheckout()">Ir al checkout →</button>
  </div>
</div>

<div class="toast" id="toast"></div>

<script>
// ── Producto ──────────────────────────────────
const PRODUCT = ${JSON.stringify({ id: p.id, name: p.name, stor: p.stor, ars: p.ars, ars_old: p.ars_old, color: p.color, offer_end: p.offer_end, img: p.img, stock_label: p.stock_label, low: p.low })};

// ── Countdown ────────────────────────────────
${p.offer_end ? `
const offerEnd = new Date('${p.offer_end}');
function tickProd(){
  const diff = offerEnd - Date.now();
  const pad = n => String(Math.max(0,Math.floor(n))).padStart(2,'0');
  if(diff <= 0){
    ['pcd-d','pcd-h','pcd-m','pcd-s'].forEach(id=>{ const el=document.getElementById(id); if(el) el.textContent='00'; });
    return;
  }
  document.getElementById('pcd-d').textContent = pad(diff/864e5);
  document.getElementById('pcd-h').textContent = pad(diff%864e5/36e5);
  document.getElementById('pcd-m').textContent = pad(diff%36e5/6e4);
  document.getElementById('pcd-s').textContent = pad(diff%6e4/1e3);
}
tickProd(); setInterval(tickProd, 1000);
` : ''}

// ── Cart ────────────────────────────────────
const ars = n => new Intl.NumberFormat('es-AR',{style:'currency',currency:'ARS',minimumFractionDigits:0}).format(n);
let cart = [];
try { cart = JSON.parse(sessionStorage.getItem('iz_cart') || '[]'); } catch{}

function saveCart(){ sessionStorage.setItem('iz_cart', JSON.stringify(cart)); }

function addToCart(){
  if(!PRODUCT.ars) return;
  const ex = cart.find(i => i.id === PRODUCT.id);
  if(ex){ ex.qty++; } else { cart.push({id:PRODUCT.id,name:PRODUCT.name,stor:PRODUCT.stor,ars:PRODUCT.ars,color:PRODUCT.color,qty:1}); }
  saveCart(); renderCart(); openCart();
  showToast('✔ Agregado al carrito');
}

function removeItem(id){
  cart = cart.filter(i => i.id !== id);
  saveCart(); renderCart();
}

function changeQty(id, d){
  const item = cart.find(i => i.id === id);
  if(!item) return;
  item.qty += d;
  if(item.qty <= 0){ removeItem(id); return; }
  saveCart(); renderCart();
}

function renderCart(){
  const body = document.getElementById('cartBody');
  const dot  = document.getElementById('cart-dot');
  const total = cart.reduce((s,i) => s + i.ars*i.qty, 0);
  const count = cart.reduce((s,i) => s + i.qty, 0);
  dot.classList.toggle('show', count > 0);
  document.getElementById('cartTotal').textContent = ars(total);
  if(!cart.length){ body.innerHTML = '<div class="cart-empty">Tu carrito está vacío</div>'; return; }
  body.innerHTML = cart.map(i => \`
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">\${i.name}</div>
        <div class="cart-item-stor">\${i.stor||''}</div>
        <div class="cart-item-price">\${ars(i.ars)}</div>
        <div class="cart-qty">
          <button class="cart-qty-btn" onclick="changeQty(\${i.id},-1)">−</button>
          <span class="cart-qty-n">\${i.qty}</span>
          <button class="cart-qty-btn" onclick="changeQty(\${i.id},1)">+</button>
          <button class="btn-rm" onclick="removeItem(\${i.id})">×</button>
        </div>
      </div>
    </div>
  \`).join('');
}

function openCart(){ document.getElementById('cartOverlay').classList.add('open'); document.getElementById('cartPanel').classList.add('open'); }
function closeCart(){ document.getElementById('cartOverlay').classList.remove('open'); document.getElementById('cartPanel').classList.remove('open'); }

function goCheckout(){
  sessionStorage.setItem('iz_cart', JSON.stringify(cart));
  window.location.href = '/#checkout';
}

let _tt;
function showToast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  clearTimeout(_tt); _tt = setTimeout(()=>t.classList.remove('show'), 2600);
}

renderCart();
</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    });
  } catch (err) {
    return new Response('Error', { status: 500 });
  }
}
