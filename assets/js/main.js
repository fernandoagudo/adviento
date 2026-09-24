(() => {
  if (!document.querySelector('link[data-adviento-images]')) { const images = document.createElement('link'); images.rel = 'stylesheet'; const script = document.querySelector('script[src*="main.js"]'); images.href = script ? new URL('../css/images.css', script.src).href : 'assets/css/images.css'; images.dataset.advientoImages = 'true'; document.head.appendChild(images); }
  if (!document.querySelector('script[data-website-id="b90ae71e-1cf9-47d2-97bd-0b20359fc86e"]')) { const analytics = document.createElement('script'); analytics.defer = true; analytics.src = 'https://cloud.umami.is/script.js'; analytics.dataset.websiteId = 'b90ae71e-1cf9-47d2-97bd-0b20359fc86e'; document.head.appendChild(analytics); }
  const newsletter = document.querySelector('.newsletter-form');
  if (newsletter) {
    const disabledStyle = document.createElement('style'); disabledStyle.textContent = '.newsletter-form button:disabled,.newsletter-form button:disabled:hover{background:#aeb5b0;color:#f7f8f6;cursor:not-allowed;opacity:.85;transform:none;box-shadow:none}'; document.head.appendChild(disabledStyle);
    const frame = document.createElement('iframe'); frame.name = 'brevo-response'; frame.title = 'Respuesta de suscripción'; frame.style.display = 'none'; newsletter.after(frame); newsletter.target = 'brevo-response';
    newsletter.addEventListener('submit', () => { const button = newsletter.querySelector('button'); button.textContent = '¡Suscripción enviada!'; button.disabled = true; const note = newsletter.querySelector('.privacy-consent-note'); if (note) note.innerHTML = 'Hemos recibido tu solicitud de suscripción.'; });
  }
  if (document.querySelector('.product-detail')) { const style = document.createElement('link'); style.rel = 'stylesheet'; style.href = '../../assets/css/product-layout-fix.css'; document.head.appendChild(style); }
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('#site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!open));
      nav.classList.toggle('is-open', !open);
    });
    nav.addEventListener('click', (event) => {
      if (event.target.closest('a')) { toggle.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
    });
  }
})();
