(() => {
  const box = document.querySelector('#product-results');
  if (!box) return;
  const type = document.body.dataset.productType === 'regalo' ? 'regalo' : 'calendario';
  const plural = type === 'regalo' ? 'regalos' : 'calendarios';
  const escape = value => String(value ?? '').replace(/[&<>'"]/g, char => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'}[char]));
  const value = name => document.querySelector(`input[name="${name}"]:checked`)?.value;
  const search = document.querySelector('#search-products');
  const count = document.querySelector('#results-count');
  let all = [];
  const render = () => {
    const audience = value('audience'), category = value('category'), max = Number(value('price'));
    const q = search.value.trim().toLowerCase();
    const items = all.filter(p => (audience === 'todos' || p.audience === audience) && (category === 'todas' || p.category === category) && (!max || p.price <= max) && (!q || `${p.title || p.name} ${p.subtitle || p.description || ''} ${(p.tags || []).join(' ')}`.toLowerCase().includes(q)));
    count.textContent = items.length === all.length ? `Mostrando ${all.length} ${plural}` : `${items.length} ${items.length === 1 ? 'resultado encontrado' : 'resultados encontrados'}`;
    const empty = document.querySelector('#no-results');
    empty.hidden = items.length > 0;
    empty.textContent = all.length === 0 ? `Todavía no hay ${plural} en el catálogo.` : 'No hemos encontrado una combinación exacta. Prueba a quitar algún filtro.';
    box.innerHTML = items.map((p, i) => {
      const detail = type === 'calendario' ? `../productos/amazon/?asin=${encodeURIComponent(p.id)}` : p.slug ? `../productos/${encodeURIComponent(p.slug)}/` : p.affiliateUrl || '';
      const name = escape(p.title || p.name);
      const img = p.imageUrl ? `<img src="${escape(p.imageUrl)}" alt="${name}" loading="lazy">` : '<span class="product-illustration">✦</span>';
      const title = detail ? `<a href="${escape(detail)}">${name}</a>` : name;
      const picture = detail ? `<a class="product-image ${escape(p.imageClass || `product-image-${['one','two','three'][i % 3]}`)}" href="${escape(detail)}">${img}</a>` : `<div class="product-image">${img}</div>`;
      const link = detail ? `<a href="${escape(detail)}">Ver ${type} <span aria-hidden="true">↗</span></a>` : '';
      return `<article class="product-card">${picture}<div class="product-info"><p class="product-category">${escape(p.categoryLabel || p.category)}</p><h3>${title}</h3><p class="product-meta">${escape(p.subtitle)}</p><div class="product-bottom"><strong>${escape(p.priceDisplay || (Number.isFinite(Number(p.price)) ? `${Number(p.price).toFixed(2).replace('.', ',')} €` : ''))}</strong>${link}</div></div></article>`;
    }).join('');
  };
  search.value = new URLSearchParams(location.search).get('q') || '';
  fetch('../data/products.json').then(response => { if (!response.ok) throw new Error('fetch'); return response.json(); }).then(data => {
    all = data.filter(p => p.type === type);
    const labels = { ninos: 'Niños' };
    ['audience', 'category'].forEach(field => {
      const container = document.querySelector(`#${field}-filters`);
      const values = [...new Set(all.map(p => p[field]).filter(item => typeof item === 'string' && item.trim()))];
      values.forEach(option => {
        const label = document.createElement('label');
        const input = document.createElement('input');
        input.type = 'radio'; input.name = field; input.value = option;
        const categoryLabel = field === 'category' ? all.find(p => p.category === option && p.categoryLabel)?.categoryLabel : null;
        const text = categoryLabel || labels[option] || option.charAt(0).toLocaleUpperCase('es') + option.slice(1);
        label.append(input, document.createTextNode(text)); container.append(label);
      });
    });
    render();
  }).catch(() => { count.textContent = `No se han podido cargar los ${plural}.`; });
  document.querySelector('.filter-panel').addEventListener('change', render);
  search.addEventListener('input', render);
  document.querySelector('#clear-filters').addEventListener('click', () => {
    ['audience', 'category', 'price'].forEach(name => { const input = document.querySelector(`input[name="${name}"]`); if (input) input.checked = true; });
    search.value = ''; render();
  });
})();
