'use strict';

// ============================================================
// monitor.js
// Live metrics, packet capture simulation, AI log analysis
// ============================================================

// ── Live Metrics ─────────────────────────────────────────────
let mReq = 847, mBlocked = 12, mUnique = 143;
const latencies = [28,34,38,41,55,29,44,62,33,38,51,36];
let latIdx = 0;

function updateMetrics() {
  mReq     += Math.floor(Math.random() * 9) + 1;
  if (Math.random() < 0.05) mBlocked++;
  if (Math.random() < 0.1)  mUnique++;
  latIdx = (latIdx + 1) % latencies.length;
  const lat = latencies[latIdx];

  const el = id => document.getElementById(id);
  if (!el('mRequests')) return;
  el('mRequests').textContent = mReq;
  el('mBlocked').textContent  = mBlocked;
  el('mLatency').textContent  = lat + 'ms';
  el('mUnique').textContent   = mUnique;
}
setInterval(updateMetrics, 2000);

// ── Traffic Canvas Chart ──────────────────────────────────────
const canvas = document.getElementById('trafficCanvas');
const chartData = Array.from({ length: 60 }, (_, i) =>
  Math.floor(40 + Math.sin(i * 0.2) * 18 + Math.random() * 14));

function drawChart() {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 800;
  const H = 160;
  canvas.width  = W;
  canvas.height = H;

  const max = Math.max(...chartData);
  const min = Math.min(...chartData);
  const range = max - min || 1;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i++) {
    const y = (H - 16) * (i / 3) + 8;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Fill gradient
  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, 'rgba(88,166,255,0.3)');
  grad.addColorStop(1, 'rgba(88,166,255,0.02)');

  ctx.beginPath();
  chartData.forEach((v, i) => {
    const x = (i / (chartData.length - 1)) * W;
    const y = H - 16 - ((v - min) / range) * (H - 32);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
  ctx.fillStyle = grad; ctx.fill();

  // Line
  ctx.beginPath();
  ctx.strokeStyle = '#58a6ff'; ctx.lineWidth = 2;
  chartData.forEach((v, i) => {
    const x = (i / (chartData.length - 1)) * W;
    const y = H - 16 - ((v - min) / range) * (H - 32);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();
}

drawChart();
window.addEventListener('resize', drawChart);
setInterval(() => {
  chartData.shift();
  chartData.push(Math.floor(40 + Math.random() * 35));
  drawChart();
}, 2000);

// ── Packet Capture ────────────────────────────────────────────
let capturing = false, pktNum = 0, captureTimer = null;

const PROTO_POOL = ['HTTPS','HTTPS','HTTPS','DNS','TCP','HTTP','THREAT'];
const INFO_MAP = {
  HTTPS:  ['TLSv1.3 Application Data', 'TLSv1.3 Client Hello', 'TLSv1.3 Server Hello', 'TLSv1.3 Certificate'],
  DNS:    ['Standard query A sagnik26nik.github.io', 'Standard query AAAA sagnik26nik.github.io', 'Standard query response 185.199.108.153'],
  TCP:    ['SYN', 'SYN-ACK', 'ACK', 'FIN, ACK'],
  HTTP:   ['GET / HTTP/1.1 → 301 Moved Permanently', 'Host: sagnik26nik.github.io'],
  THREAT: ['SQL Injection probe: UNION SELECT detected', 'XSS attempt: <script> in query param', 'Brute-force: 5 POST /login in 10s']
};

function rip(prefix) { return `${prefix}.${~~(Math.random()*254)+1}.${~~(Math.random()*254)+1}`; }

function addPacket() {
  const proto  = PROTO_POOL[~~(Math.random() * PROTO_POOL.length)];
  const info   = INFO_MAP[proto][~~(Math.random() * INFO_MAP[proto].length)];
  const threat = proto === 'THREAT';
  const dns    = proto === 'DNS';

  pktNum++;
  document.getElementById('pktCount').textContent = pktNum;

  const tr  = document.createElement('tr');
  tr.className = threat ? 'pkt-threat' : dns ? 'pkt-dns' : proto === 'HTTPS' ? 'pkt-https' : '';

  const src = threat ? rip('203.0.113') : rip('192.168.1');
  const dst = '185.199.108.153';
  const len = ~~(Math.random() * 900) + 40;
  const t   = (pktNum * 0.041 + Math.random() * 0.009).toFixed(4);

  tr.innerHTML = `<td>${pktNum}</td><td>${t}</td><td>${src}</td><td>${dst}</td>
    <td>${proto}</td><td>${len}</td><td>${info}</td>`;

  const body = document.getElementById('packetBody');
  if (body.querySelector('.pkt-empty')) body.innerHTML = '';
  body.insertBefore(tr, body.firstChild);
  while (body.children.length > 150) body.removeChild(body.lastChild);
}

window.toggleCapture = function() {
  const btn = document.getElementById('captureBtn');
  capturing = !capturing;
  if (capturing) {
    btn.textContent = '⏹ Stop Capture';
    btn.classList.remove('btn-primary'); btn.classList.add('btn-outline');
    captureTimer = setInterval(addPacket, 500);
  } else {
    btn.textContent = '▶ Start Capture';
    btn.classList.add('btn-primary'); btn.classList.remove('btn-outline');
    clearInterval(captureTimer);
  }
};

window.clearPackets = function() {
  pktNum = 0;
  document.getElementById('pktCount').textContent = 0;
  document.getElementById('packetBody').innerHTML =
    '<tr><td colspan="7" class="pkt-empty">Press Start Capture to begin</td></tr>';
};

// ── AI Log Analysis (Challenge Feature) ──────────────────────
window.analyzeLog = async function() {
  const logText = document.getElementById('logInput').value.trim();
  if (!logText) { alert('Paste some log content first.'); return; }

  const btn     = document.getElementById('analyzeBtn');
  const result  = document.getElementById('aiResult');
  const content = document.getElementById('aiContent');
  const ts      = document.getElementById('aiTimestamp');

  btn.disabled    = true;
  btn.textContent = '⏳ Analyzing...';
  result.style.display = 'block';
  content.textContent  = 'Sending to Claude AI...';
  content.style.color  = '';

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: `You are a network security analyst performing intrusion detection on server logs.
Analyze the provided logs and respond in this EXACT format:

THREAT SUMMARY
--------------
[1-2 sentence overall assessment]

DETECTED THREATS
----------------
[List each threat with: IP | Type | Evidence | Severity]
If none: "No threats detected."

RISK LEVEL: [NONE / LOW / MEDIUM / HIGH / CRITICAL]

RECOMMENDED ACTIONS
-------------------
[3-5 specific, actionable steps based on what you found]

Be concise and technical. Reference actual IPs and log lines.`,
        messages: [{ role: 'user', content: `Analyze these server logs for security threats:\n\n${logText}` }]
      })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);

    const text = data.content
      .filter(b => b.type === 'text')
      .map(b => b.text)
      .join('');

    content.textContent = text;
    ts.textContent = new Date().toLocaleTimeString();

  } catch (err) {
    content.textContent = `Error: ${err.message}\n\nNote: The AI log analysis feature requires this page to be served from a backend that proxies the Anthropic API call (to keep the API key server-side). For the demo, paste logs and the analysis structure is shown above.`;
    content.style.color = '#f85149';
  } finally {
    btn.disabled    = false;
    btn.textContent = '🔍 Analyze with AI';
  }
};

window.loadSample = function() {
  document.getElementById('logInput').value =
`192.168.1.100 - - [30/Apr/2026:14:23:01 +0000] "GET / HTTP/1.1" 200 1234 "Mozilla/5.0"
192.168.1.101 - - [30/Apr/2026:14:23:02 +0000] "GET /networking.html HTTP/1.1" 200 4521 "Mozilla/5.0"
10.0.0.5 - - [30/Apr/2026:14:23:03 +0000] "POST /login HTTP/1.1" 401 432 "curl/7.64.1"
10.0.0.5 - - [30/Apr/2026:14:23:04 +0000] "POST /login HTTP/1.1" 401 432 "curl/7.64.1"
10.0.0.5 - - [30/Apr/2026:14:23:05 +0000] "POST /login HTTP/1.1" 401 432 "curl/7.64.1"
10.0.0.5 - - [30/Apr/2026:14:23:06 +0000] "POST /login HTTP/1.1" 401 432 "curl/7.64.1"
10.0.0.5 - - [30/Apr/2026:14:23:07 +0000] "POST /login HTTP/1.1" 401 432 "curl/7.64.1"
10.0.0.5 - - [30/Apr/2026:14:23:08 +0000] "POST /login HTTP/1.1" 429 0 "curl/7.64.1"
203.0.113.42 - - [30/Apr/2026:14:24:10 +0000] "GET /?id=1 OR 1=1-- HTTP/1.1" 403 0 "sqlmap/1.7"
203.0.113.42 - - [30/Apr/2026:14:24:11 +0000] "GET /?id=1 UNION SELECT table_name FROM information_schema.tables-- HTTP/1.1" 403 0 "sqlmap/1.7"
203.0.113.44 - - [30/Apr/2026:14:25:01 +0000] "GET /search?q=<script>document.cookie</script> HTTP/1.1" 403 0 "Mozilla/5.0"
192.168.1.200 - - [30/Apr/2026:14:26:00 +0000] "GET /monitor.html HTTP/1.1" 200 8900 "Mozilla/5.0"`;
};
