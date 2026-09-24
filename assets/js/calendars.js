(() => {
  const results = document.querySelector('#calendar-results');
  if (!results) return;
  const filter = results.dataset.filter || 'all';
  const render = (items) => {
    const visible = items.filter((p) => {
      if (p.type !== 'calendario') return false;
      if (filter === 'all') return true;
      const [key, value] = filter.split(':');
      return p[key] === value;
    });
    results.innerHTML = visible.length ? visible.map((p) => `<article class="product-card"><a class="product-image ${p.imageClass}" href="../../productos/${p.slug}/"><span class="pill">Selección editorial</span><span class="product-illustration">✦</span></a><div class="product-info"><p class="product-category">${p.category}</p><h3><a href="../../productos/${p.slug}/">${p.name}</a></h3><p class="product-meta">${p.description}</p><div class="product-bottom"><strong>Desde ${p.price.toFixed(2).replace('.', ',')} €</strong><a href="${p.affiliateUrl}" rel="sponsored noopener">Ver opción ↗</a></div></div></article>`).join('') : '<p class="no-results">Pronto añadiremos calendarios para esta selección.</p>';
  };
  fetch('../../data/products.json').then((response) => response.json()).then(render);
})();
