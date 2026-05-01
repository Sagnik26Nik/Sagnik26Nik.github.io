# CN Project 2 — Secure, Optimize, and Monitor Your Website

**Computer Networking · Spring 2026 · Georgia State University**  
**Live site:** https://sagnik26nik.github.io

---

## Rubric Coverage

| Category | Points | What We Did |
|----------|--------|-------------|
| Security Features | 30 | HTTPS, CSP, XSS/DOMPurify, CSRF tokens, rate limiting, secure cookies |
| Database Integration | 20 | Firebase Firestore contact form with validated/sanitized input |
| Performance Optimization | 20 | Cloudflare CDN, lazy loading, GitHub Actions CSS/JS minification |
| Scalability & Deployment | 15 | GitHub Pages, IPv6 via Fastly, CI/CD pipeline |
| Traffic Monitoring | 10 | Google Analytics, Wireshark simulation, Prometheus metrics |
| Report Quality | 5 | See technical report PDF |
| **Challenge** | Bonus | GitHub Actions CI/CD + Claude AI intrusion detection |

---

## Quick Setup (Windows + VS Code)

### Step 1 — Clone your repo
```bash
git clone https://github.com/sagnik26nik/sagnik26nik.github.io
cd sagnik26nik.github.io
```

### Step 2 — Copy project files
Copy all files from this folder into your cloned repo, replacing what's there.

### Step 3 — Enable GitHub Pages with GitHub Actions
1. Go to your repo on GitHub
2. **Settings → Pages → Source → GitHub Actions**
3. That's it — the workflow in `.github/workflows/deploy.yml` handles everything

### Step 4 — Set up Firebase (for contact form)
1. Go to https://console.firebase.google.com
2. Click **Add project** → name it → continue
3. Click **< / >** (Web app) → register → copy the config object
4. Open `js/contact.js` — replace the `firebaseConfig` values
5. In Firebase Console → **Firestore Database → Create database → Start in test mode**
6. Add this security rule to restrict reads:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /contact_submissions/{doc} {
      allow create: if true;   // anyone can submit
      allow read, update, delete: if false;  // only you can read
    }
  }
}
```

### Step 5 — Set up Google Analytics
1. Go to https://analytics.google.com
2. **Admin → Create Property → Web** → enter your URL
3. Copy your **Measurement ID** (format: `G-XXXXXXXXXX`)
4. Find and replace `G-XXXXXXXXXX` in all 5 HTML files

### Step 6 — Push and deploy
```bash
git add .
git commit -m "Project 2: security, performance, monitoring, CI/CD"
git push origin main
```
The GitHub Actions workflow runs automatically. Check progress at:
`github.com/sagnik26nik/sagnik26nik.github.io/actions`

---

## Project Structure

```
├── index.html                    # Homepage — feature overview
├── networking.html               # DNS, IPv4/IPv6, HTTPS, CDN, lazy loading
├── security.html                 # Security demos (XSS, rate limit, CSRF)
├── contact.html                  # Firebase Firestore contact form
├── monitor.html                  # Analytics, Wireshark sim, Prometheus, AI analysis
├── css/
│   └── style.css                 # Main stylesheet
├── js/
│   ├── main.js                   # Nav, CSRF injection, lazy loading
│   ├── security.js               # RateLimiter, Sanitizer, CSRF utilities
│   ├── contact.js                # Firebase form handler (ES module)
│   └── monitor.js                # Metrics, packet sim, AI log analysis
├── .github/
│   └── workflows/
│       └── deploy.yml            # CI/CD: security scan → minify → deploy
└── README.md
```

---

## Security Features Explained

### 1. HTTPS / TLS
GitHub Pages auto-provisions Let's Encrypt TLS. All HTTP → HTTPS (301 redirect).

### 2. Content Security Policy
Every HTML page has a `<meta http-equiv="Content-Security-Policy">` header that:
- Restricts scripts to trusted origins only
- Blocks inline event handlers
- Prevents data exfiltration to unknown domains

### 3. XSS Prevention — DOMPurify
All user input is sanitized with `DOMPurify.sanitize(input, { ALLOWED_TAGS: [] })` before any DOM insertion or database write. DOMPurify is loaded from `cdnjs.cloudflare.com` (also serves as CDN usage).

### 4. CSRF Tokens
`crypto.randomUUID()` generates a session token on every page load. Injected as a hidden `_csrf` field into every form. Validated before processing.

### 5. Rate Limiting
`RateLimiter` class (token bucket) limits form submissions to configurable attempts per window. Contact form: 3 per 5 minutes. Security demo: 5 per 60 seconds.

### 6. Secure Cookies
Demonstrated with code example: `HttpOnly` (no JS access), `Secure` (HTTPS only), `SameSite=Strict` (no cross-site).

---

## Verify DNS / IPv6 Yourself

```bash
# IPv4
nslookup sagnik26nik.github.io
# → 185.199.108.153

# IPv6
nslookup -type=AAAA sagnik26nik.github.io
# → 2606:50c0:8000::153

# TLS certificate
curl -I https://sagnik26nik.github.io | grep -i "strict\|content-type\|frame"
```
