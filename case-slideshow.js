
(() => {
  'use strict';
  const root = document.documentElement;
  document.querySelectorAll('[data-case-slideshow]').forEach(carousel => {
    const slides = [...carousel.querySelectorAll('[data-slide]')];
    if (slides.length < 2) return;
    const caption = carousel.querySelector('[data-slide-caption]');
    const count = carousel.querySelector('[data-slide-count]');
    const play = carousel.querySelector('[data-slide-play]');
    const announcement = carousel.querySelector('[data-slide-announcement]');
    let current = 0, paused = false, hovered = false, visible = true;
    let changedAt = performance.now();
    const motionBlocked = () => root.classList.contains('motion-off');
    const sync = () => {
      const blocked = motionBlocked();
      play.disabled = blocked;
      play.textContent = blocked ? 'Motion paused' : paused ? 'Play ▶' : 'Pause Ⅱ';
      play.setAttribute('aria-label', blocked ? 'Picture slideshow paused by motion preference' : paused ? 'Play picture slideshow' : 'Pause picture slideshow');
      play.setAttribute('aria-pressed', String(paused || blocked));
      changedAt = performance.now();
    };
    function show(index, manual = false) {
      current = (index + slides.length) % slides.length;
      slides.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === current);
        slide.setAttribute('aria-hidden', String(i !== current));
      });
      caption.textContent = slides[current].dataset.caption;
      count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
      if (manual) announcement.textContent = `Picture ${current + 1} of ${slides.length}: ${slides[current].querySelector('img').alt}`;
      changedAt = performance.now();
    }
    carousel.querySelector('.case-slide-buttons').hidden = false;
    carousel.querySelector('[data-slide-prev]').addEventListener('click', () => show(current - 1, true));
    carousel.querySelector('[data-slide-next]').addEventListener('click', () => show(current + 1, true));
    play.addEventListener('click', () => { paused = !paused; sync(); });
    carousel.addEventListener('pointerenter', () => { hovered = true; });
    carousel.addEventListener('pointerleave', () => { hovered = false; changedAt = performance.now(); });
    carousel.addEventListener('keydown', event => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      event.preventDefault(); show(current + (event.key === 'ArrowRight' ? 1 : -1), true);
    });
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(entries => {
        visible = entries[0].isIntersecting;
        if (visible) changedAt = performance.now();
      }, { threshold: .15 }).observe(carousel);
    }
    new MutationObserver(sync).observe(root, { attributes: true, attributeFilter: ['class'] });
    sync();
    setInterval(() => {
      if (paused || motionBlocked() || hovered || !visible || document.hidden || document.querySelector('dialog[open]') || carousel.contains(document.activeElement)) return;
      if (performance.now() - changedAt >= 5000) show(current + 1);
    }, 500);
  });
})();
