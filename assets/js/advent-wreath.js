(() => {
  'use strict';

  const details = {
    overview: {
      title: 'La Corona de Adviento', label: 'Cuatro domingos de preparación', color: '#15803d',
      text: 'Cada domingo se enciende una vela más: una en la primera semana, dos en la segunda, tres en la tercera y cuatro en la última. Selecciona una vela o una tarjeta para descubrir su significado.'
    },
    week1: {
      title: '1º Domingo: Esperanza — Vela Morada', label: 'Morado litúrgico', color: '#7e22ce',
      text: 'Simboliza la esperanza activa del pueblo en la venida del Salvador y la preparación espiritual para el perdón de Dios. En este primer domingo se enciende una vela.'
    },
    week2: {
      title: '2º Domingo: Fe y Paz — Vela Morada', label: 'Morado litúrgico', color: '#7e22ce',
      text: 'Invita a preparar el corazón para la Navidad, fortalecer la fe y construir la paz con pequeños gestos. En este segundo domingo se encienden dos velas.'
    },
    week3: {
      title: '3º Domingo: Gozo — Vela Rosada', label: 'Domingo de Gaudete', color: '#db2777',
      text: 'La vela rosada expresa la alegría por la cercanía de la Navidad. Este domingo se conoce como Gaudete, una invitación a alegrarse. Se encienden tres velas.'
    },
    week4: {
      title: '4º Domingo: Amor — Vela Morada', label: 'Morado litúrgico', color: '#7e22ce',
      text: 'Invita a vivir el amor y la acogida en los últimos días de preparación para la Navidad. En este cuarto domingo se encienden las cuatro velas.'
    },
    circle: {
      title: 'La forma circular de la corona', label: 'Eternidad de Dios', color: '#15803d',
      text: 'El círculo no tiene principio ni fin. Representa la eternidad de Dios y su amor que permanece. Haz clic en una vela para volver a explorar las semanas.'
    },
    foliage: {
      title: 'El follaje perenne', label: 'Vida eterna y gracia', color: '#15803d',
      text: 'Las ramas que conservan su verdor simbolizan la vida que permanece y la esperanza que se renueva. Su color verde evoca la vida eterna y la gracia de Dios.'
    }
  };

  function initialize(root) {
    if (root.dataset.wreathReady === 'true') return;
    root.dataset.wreathReady = 'true';
    let progress = 4;
    let filter = 'all';
    let selection = 'week1';

    function render() {
      root.querySelectorAll('[data-progress]').forEach(button => {
        const active = button.dataset.progress === filter;
        button.classList.toggle('is-active', active);
        button.setAttribute('aria-pressed', String(active));
      });
      root.querySelectorAll('[data-item]').forEach(button => {
        const selected = button.dataset.item === selection;
        button.classList.toggle('is-selected', selected);
        button.setAttribute('aria-pressed', String(selected));
        const week = Number(button.dataset.item.replace('week', ''));
        if (week >= 1 && week <= 4) {
          const lit = week <= progress;
          button.classList.toggle('is-future', !lit);
          button.setAttribute('aria-label', `Semana ${week}: ${lit ? 'vela encendida' : 'vela apagada'}. Mostrar significado`);
        }
      });
      root.querySelectorAll('[data-flame]').forEach(flame => {
        flame.style.opacity = Number(flame.dataset.flame) <= progress ? '1' : '0';
      });
      const detail = details[selection];
      root.querySelector('[data-detail-title]').textContent = detail.title;
      root.querySelector('[data-detail-label]').textContent = detail.label;
      root.querySelector('[data-detail-text]').textContent = detail.text;
      root.querySelector('[data-detail]').style.borderLeftColor = detail.color;
      root.querySelector('[data-status]').textContent = `${progress} ${progress === 1 ? 'vela encendida' : 'velas encendidas'}`;
    }

    root.addEventListener('click', event => {
      const button = event.target.closest('button');
      if (!button || !root.contains(button)) return;
      if (button.hasAttribute('data-progress')) {
        filter = button.dataset.progress;
        progress = filter === 'all' ? 4 : Number(filter);
        selection = filter === 'all' ? 'overview' : `week${progress}`;
      } else if (button.hasAttribute('data-item') && details[button.dataset.item]) {
        selection = button.dataset.item;
        if (selection.startsWith('week')) {
          progress = Number(selection.replace('week', ''));
          filter = String(progress);
        }
      } else {
        return;
      }
      render();
    });
    render();
  }

  const initializeAll = () => document.querySelectorAll('[data-advent-wreath]').forEach(initialize);
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAll, { once: true });
  } else {
    initializeAll();
  }
})();
