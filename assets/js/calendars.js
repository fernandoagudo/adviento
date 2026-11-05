(() => {
  const results = document.querySelector('#calendar-results');
  if (!results) return;
  const filter = results.dataset.filter || 'all';
  const escape = (value) => String(value ?? '').replace(/[&<>'"]/g, (char) => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[char]));
  const render = (items) => {
    const visible = items.filter((p) => {
      if (p.type !== 'calendario') return false;
      if (filter === 'all') return true;
      const [key, value] = filter.split(':');
      return p[key] === value;
    });
    results.innerHTML = visible.length ? visible.map((p, i) => {
      const url = `../../productos/amazon/?asin=${encodeURIComponent(p.id)}`;
      const name = escape(p.title || p.name);
      const image = p.imageUrl ? `<img src="${escape(p.imageUrl)}" alt="${name}" loading="lazy">` : '<span class="product-illustration">✦</span>';
      const price = escape(p.priceDisplay || `${Number(p.price).toFixed(2).replace('.', ',')} €`);
      return `<article class="product-card"><a class="product-image ${escape(p.imageClass || `product-image-${['one', 'two', 'three'][i % 3]}`)}" href="${url}">${image}</a><div class="product-info"><p class="product-category">${escape(p.categoryLabel || p.category)}</p><h3><a href="${url}">${name}</a></h3><p class="product-meta">${escape(p.subtitle)}</p><div class="product-bottom"><strong>${price}</strong><a href="${url}">Ver más ↗</a></div></div></article>`;
    }).join('') : '<p class="no-results">Pronto añadiremos calendarios para esta selección.</p>';
  };
  fetch('../../data/products.json').then((response) => response.json()).then(render).catch(() => {
    results.innerHTML = '<p class="no-results">No se han podido cargar los calendarios. Inténtalo de nuevo más tarde.</p>';
  });
})();
