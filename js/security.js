'use strict';

// ============================================================
// security.js
// Reusable security utilities used across the site.
// ============================================================

// ── RateLimiter ───────────────────────────────────────────────
// Token bucket implementation.
// Usage:
//   const rl = new RateLimiter(5, 60000); // 5 per 60s
//   try { rl.check(); } catch(e) { showError(e.message); }
class RateLimiter {
  constructor(max = 5, windowMs = 60000) {
    this.max      = max;
    this.windowMs = windowMs;
    this.attempts = 0;
    this.resetAt  = null;
  }

  check() {
    const now = Date.now();
    // Reset window if expired
    if (this.resetAt && now > this.resetAt) {
      this.attempts = 0;
      this.resetAt  = null;
    }
    // Enforce limit
    if (this.attempts >= this.max) {
      const wait = Math.ceil((this.resetAt - now) / 1000);
      throw new Error(`Rate limit exceeded. Try again in ${wait}s.`);
    }
    // Record attempt
    this.attempts++;
    if (this.attempts === 1) {
      this.resetAt = now + this.windowMs;
    }
  }

  get remaining() {
    if (!this.resetAt || Date.now() > this.resetAt) return this.max;
    return Math.max(0, this.max - this.attempts);
  }
}

// ── Sanitizer ─────────────────────────────────────────────────
// Wraps DOMPurify. Falls back to manual escaping if DOMPurify
// is not loaded.
const Sanitizer = {
  text(input) {
    if (typeof input !== 'string') return '';
    if (typeof DOMPurify !== 'undefined') {
      // Strip ALL tags — only plain text allowed
      return DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
    }
    // Manual fallback
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  email(input) {
    // RFC 5321 simplified validation
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input);
  }
};

// ── CSRF helpers ──────────────────────────────────────────────
const CSRF = {
  getToken() {
    let t = sessionStorage.getItem('csrf_token');
    if (!t) { t = crypto.randomUUID(); sessionStorage.setItem('csrf_token', t); }
    return t;
  },
  validate(submitted) {
    const expected = sessionStorage.getItem('csrf_token');
    if (!expected || submitted !== expected) {
      throw new Error('CSRF validation failed. Please refresh and try again.');
    }
  }
};

// ── Expose globally ───────────────────────────────────────────
window.RateLimiter = RateLimiter;
window.Sanitizer   = Sanitizer;
window.CSRF        = CSRF;
