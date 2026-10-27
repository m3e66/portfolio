
'use strict';
// Restore the site's motion preference before setting up entrance effects.
const motionRoot = document.documentElement;
try {
  const saved = JSON.parse(localStorage.getItem('leo-os-playground-v1') || 'null');
  motionRoot.classList.toggle('motion-off', saved?.motionOff === true);
} catch { /* Keep the on-page motion controls available without storage. */ }
const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('.nav-links');
function closeMenu() {
  if (!menuButton || !navigation) return;
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.textContent = 'Menu +';
  navigation.classList.remove('is-open');
}
menuButton?.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.textContent = open ? 'Close −' : 'Menu +';
  navigation.classList.toggle('is-open', open);
});
navigation?.addEventListener('click', e => { if (e.target.closest('a')) closeMenu(); });
document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && menuButton?.getAttribute('aria-expanded') === 'true') {
    closeMenu(); menuButton.focus();
  }
});

const reveals = [...document.querySelectorAll('.reveal')];
let entranceObserver;
if ('IntersectionObserver' in window && !motionRoot.classList.contains('motion-off')) {
  entranceObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.remove('is-pending');
        entry.target.classList.add('is-visible');
        entranceObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -15px 0px' });
  reveals.forEach(el => { el.classList.add('is-pending'); entranceObserver.observe(el); });
}
function showAllContent() {
  entranceObserver?.disconnect();
  reveals.forEach(el => { el.classList.remove('is-pending'); el.classList.add('is-visible'); });
}

const motionButton = document.querySelector('.motion-button');
motionButton?.addEventListener('click', () => {
  const off = document.documentElement.classList.toggle('motion-off');
  motionButton.setAttribute('aria-pressed', String(off));
  motionButton.textContent = off ? 'Resume motion' : 'Pause motion';
  if (off) showAllContent();
});

if (window.matchMedia('(pointer: fine)').matches) {
  document.querySelectorAll('.project-feature').forEach(card => {
    card.addEventListener('pointermove', e => {
      if (motionRoot.classList.contains('motion-off')) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`);
      card.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`);
    });
  });
}

const sections = [...document.querySelectorAll('[data-nav-section]')];
const navLinks = [...document.querySelectorAll('.nav-links a[data-section]')];
let scrollQueued = false;
function updateNavigation() {
  scrollQueued = false;
  let active = '';
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= 160) active = section.dataset.navSection;
  }
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4 && sections.length) {
    active = sections[sections.length - 1].dataset.navSection;
  }
  navLinks.forEach(link => {
    if (link.dataset.section === active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
}
if (sections.length) {
  addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateNavigation); } }, { passive: true });
  updateNavigation();
}

document.querySelectorAll('[data-copy-email]').forEach(button => {
  button.addEventListener('click', async () => {
    const status = document.querySelector('.contact-status');
    const fallback = document.querySelector('.email-fallback');
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText('LeoXu524@gmail.com');
      status.textContent = 'Email address copied';
      fallback.hidden = true;
    } catch {
      fallback.hidden = false;
      fallback.focus(); fallback.select();
      status.textContent = 'Copy the selected address and paste it into your email service';
    }
  });
});

const galleryButtons = [...document.querySelectorAll('[data-lightbox]')];
const lightbox = document.querySelector('.lightbox');
if (galleryButtons.length && lightbox) {
  let current = 0;
  let previousFocus;
  const image = lightbox.querySelector('img');
  const caption = lightbox.querySelector('.lightbox-caption');
  const count = lightbox.querySelector('.lightbox-count');
  function show(index) {
    current = (index + galleryButtons.length) % galleryButtons.length;
    const source = galleryButtons[current];
    image.src = source.dataset.lightbox;
    image.alt = source.querySelector('img').alt;
    caption.textContent = source.dataset.caption || image.alt;
    count.textContent = `${current + 1} / ${galleryButtons.length}`;
  }
  galleryButtons.forEach((button, i) => button.addEventListener('click', () => {
    previousFocus = button; show(i); lightbox.showModal();
    document.body.style.overflow = 'hidden';
  }));
  lightbox.querySelector('[data-close]').addEventListener('click', () => lightbox.close());
  lightbox.querySelector('[data-prev]').addEventListener('click', () => show(current - 1));
  lightbox.querySelector('[data-next]').addEventListener('click', () => show(current + 1));
  lightbox.addEventListener('click', e => { if (e.target === lightbox) { const r = lightbox.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) lightbox.close(); } });
  lightbox.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1); }
  });
  lightbox.addEventListener('close', () => { document.body.style.overflow = ''; previousFocus?.focus(); });
}
