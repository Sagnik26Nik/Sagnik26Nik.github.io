// ============================================================
// contact.js  (ES Module — loaded with type="module")
//
// Firebase Firestore contact form.
// SETUP: Replace the firebaseConfig object below with your
// own values from:
//   Firebase Console → Project Settings → Your Apps → Web App
// ============================================================

import { initializeApp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore, collection, addDoc, serverTimestamp }
  from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';

// ─────────────────────────────────────────────────────────────
// 🔧 REPLACE THESE VALUES WITH YOUR FIREBASE PROJECT CONFIG
// Get them from: console.firebase.google.com
//   → Your Project → Project Settings → Your apps → Web
// ─────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey:            "AIzaSyD0s99teY8Gi-0TZgStK1kKfa2doO9FKTQ",
  authDomain:        "portfolio-b7d08.firebaseapp.com",
  projectId:         "portfolio-b7d08",
  storageBucket:     "portfolio-b7d08.firebasestorage.app",
  messagingSenderId: "539847861677",
  appId:             "1:539847861677:web:13b243c2654ca3c8c4ad24",
  measurementId:     "G-S0QSLZK6DT"
};

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ── Rate limiter: 3 submissions per 5 minutes ─────────────────
const submitLimiter = new RateLimiter(3, 5 * 60 * 1000);

// ── Form handler ──────────────────────────────────────────────
const form        = document.getElementById('contactForm');
const errBox      = document.getElementById('formGlobalError');
const successBox  = document.getElementById('formSuccess');
const submitBtn   = document.getElementById('submitBtn');

function showError(msg) {
  errBox.textContent    = msg;
  errBox.style.display  = 'block';
  successBox.style.display = 'none';
}
function showSuccess(msg) {
  successBox.textContent = msg;
  successBox.style.display = 'block';
  errBox.style.display   = 'none';
}
function clearMessages() {
  errBox.style.display = successBox.style.display = 'none';
}
function fieldErr(id, msg) {
  const f = document.getElementById(id);
  const e = document.getElementById(id + '-err');
  if (f) f.classList.add('invalid');
  if (e) e.textContent = msg;
}
function clearFieldErrs() {
  document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
  document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();
    clearFieldErrs();

    // ── STEP 1: CSRF Validation ────────────────────────────
    const submittedToken = form.querySelector('[name="_csrf"]')?.value || '';
    try {
      CSRF.validate(submittedToken);
    } catch (err) {
      showError('⚠️ ' + err.message);
      return;
    }

    // ── STEP 2: Rate Limiting ──────────────────────────────
    try {
      submitLimiter.check();
    } catch (err) {
      showError('⏱️ ' + err.message);
      return;
    }

    // ── STEP 3: Client Validation ──────────────────────────
    const name    = document.getElementById('fname').value.trim();
    const email   = document.getElementById('femail').value.trim();
    const subject = document.getElementById('fsubject').value.trim();
    const message = document.getElementById('fmessage').value.trim();
    let valid = true;

    if (!name || name.length < 2) {
      fieldErr('fname', 'Name must be at least 2 characters.'); valid = false;
    }
    if (!email || !Sanitizer.email(email)) {
      fieldErr('femail', 'Enter a valid email address.'); valid = false;
    }
    if (!message || message.length < 10) {
      fieldErr('fmessage', 'Message must be at least 10 characters.'); valid = false;
    }
    if (!valid) return;

    // ── STEP 4: XSS Sanitization ───────────────────────────
    const clean = {
      name:      Sanitizer.text(name).slice(0, 100),
      email:     Sanitizer.text(email).slice(0, 254),
      subject:   Sanitizer.text(subject).slice(0, 200),
      message:   Sanitizer.text(message).slice(0, 2000),
      timestamp: serverTimestamp(),
      page:      window.location.href
    };

    // ── STEP 5: Write to Firebase Firestore ─────────────────
    submitBtn.disabled   = true;
    submitBtn.textContent = '⏳ Sending...';

    try {
      await addDoc(collection(db, 'contact_submissions'), clean);
      showSuccess('✅ Message sent! Stored securely in Firebase Firestore. All inputs were CSRF-validated, rate-checked, and XSS-sanitized before storage.');
      form.reset();
      // Rotate CSRF token after successful submit
      const newToken = crypto.randomUUID();
      sessionStorage.setItem('csrf_token', newToken);
      form.querySelector('[name="_csrf"]').value = newToken;

    } catch (err) {
      // Graceful demo-mode fallback when Firebase isn't configured yet
      if (err.code === 'app/invalid-credential' || err.message?.includes('API key')) {
        showSuccess('⚠️ Demo mode: Firebase credentials not yet configured.\n\nAll security checks PASSED:\n✅ CSRF token valid\n✅ Rate limit OK\n✅ Inputs validated\n✅ XSS sanitized with DOMPurify\n\nReplace firebaseConfig in js/contact.js to enable real storage.');
      } else {
        showError(`Firebase error: ${err.message}`);
      }
    } finally {
      submitBtn.disabled   = false;
      submitBtn.textContent = 'Send Message';
    }
  });
}
