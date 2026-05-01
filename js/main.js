'use strict';

// ── Mobile Nav ───────────────────────────────────────────────
const burger  = document.getElementById('navBurger');
const navMenu = document.getElementById('navMenu');
if (burger && navMenu) {
  burger.addEventListener('click', () => {
    const open = navMenu.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', (e) => {
    if (!burger.contains(e.target) && !navMenu.contains(e.target)) {
      navMenu.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── CSRF Token Injection ──────────────────────────────────────
// Runs on every page. Generates a UUID per session and injects
// it as a hidden _csrf field into every <form> on the page.
function injectCSRFTokens() {
  let token = sessionStorage.getItem('csrf_token');
  if (!token) {
    token = crypto.randomUUID();
    sessionStorage.setItem('csrf_token', token);
  }
  document.querySelectorAll('form').forEach(form => {
    let input = form.querySelector('[name="_csrf"]');
    if (!input) {
      input = document.createElement('input');
      input.type = 'hidden';
      input.name = '_csrf';
      form.appendChild(input);
    }
    input.value = token;
  });
}
injectCSRFTokens();

// ── Lazy Loading — Intersection Observer fallback ─────────────
// Supplements native loading="lazy" for older browsers.
// Images use data-src instead of src until they enter viewport.
(function setupLazyLoad() {
  if (!('IntersectionObserver' in window)) {
    // Fallback: just load all images immediately
    document.querySelectorAll('img[data-src]').forEach(img => {
      img.src = img.dataset.src;
    });
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  }, { rootMargin: '200px 0px' });

  document.querySelectorAll('img[data-src]').forEach(img => observer.observe(img));
})();

// ── Character counter for contact form textarea ───────────────
const msgArea  = document.getElementById('fmessage');
const charSpan = document.getElementById('charCount');
if (msgArea && charSpan) {
  msgArea.addEventListener('input', () => {
    const len = msgArea.value.length;
    charSpan.textContent = len;
    charSpan.style.color = len > 1900 ? 'var(--danger)' : '';
  });
}
