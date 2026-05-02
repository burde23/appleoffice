// functions/api/producto/[slug].js
// GET /api/producto/:slug → devuelve el producto cuyo nombre coincide con el slug

function slugify(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function onRequestGet({ params, env }) {
  try {
    const slug = params.slug;
    const { results } = await env.DB
      .prepare('SELECT * FROM products WHERE active = 1 ORDER BY id ASC')
      .all();

    const product = results.find(p => slugify(p.name) === slug);

    if (!product) {
      return json({ ok: false, error: 'Producto no encontrado' }, 404);
    }

    return json({
      ok: true,
      product: {
        ...product,
        low:       product.low    === 1,
        active:    product.active === 1,
        ars:       product.ars       ?? null,
        ars_old:   product.ars_old   ?? null,
        usd:       product.usd       ?? null,
        img:       product.img       ?? null,
        offer_end: product.offer_end ?? null,
      }
    });
  } catch (err) {
    return json({ ok: false, error: err.message }, 500);
  }
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
