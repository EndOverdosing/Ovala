"use strict";

const form = document.getElementById("uv-form");
const address = document.getElementById("uv-address");
const searchEngine = document.getElementById("uv-search-engine");
const error = document.getElementById("uv-error");
const errorCode = document.getElementById("uv-error-code");

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  try {
    await registerSW();
  } catch (err) {
    error.textContent = "Failed to register service worker.";
    errorCode.textContent = err.toString();
    throw err;
  }

  const url = search(address.value, searchEngine.value);
  location.href = __uv$config.prefix + __uv$config.encodeUrl(url);
});

function autofill(url) {
  address.value = url;
  form.requestSubmit();
}

const clockEl = document.getElementById('clock');
function tick() {
  clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
}
tick(); setInterval(tick, 1000);

const GLYPHS = {
  'O': [
    [0, 1, 1, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 1, 1, 0],
  ],
  'V': [
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [0, 1, 0, 1, 0],
    [0, 1, 0, 1, 0],
    [0, 0, 1, 0, 0],
  ],
  'A': [
    [0, 0, 1, 0, 0],
    [0, 1, 0, 1, 0],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
    [1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1],
    [1, 0, 0, 0, 1],
  ],
  'L': [
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 0, 0, 0],
    [1, 1, 1, 1],
  ],
};

const FILL_CHARS = '·∙•:,. ooO0@#%*+=-';
const SHIMMER_CHARS = '·∙•:,.oO0';

const canvas = document.getElementById('ascii-canvas-el');
const ctx = canvas.getContext('2d');

const ROWS = 7;
const GLYPH_COLS = { 'O': 5, 'V': 5, 'A': 5, 'L': 4 };
const WORD = 'OVALA';

let particles = [];
let mouseX = -9999;
let mouseY = -9999;
let fontSize = 11;
let cellW, cellH, charW, charH;
let canvasOffsetX, canvasOffsetY;
let isTouching = false;

const REPEL_RADIUS = 50;
const REPEL_STRENGTH = 2.4;
const RETURN_SPEED = 0.1;
const DAMPING = 0.88;

function getFontSize() {
  const vw = window.innerWidth;
  if (vw <= 480) return Math.max(8, vw * 0.028);
  return Math.max(5, Math.min(11, vw * 0.011));
}

function buildParticles() {
  const w = window.innerWidth <= 480 ? 3 : 4;
  const h = window.innerWidth <= 480 ? 2 : 2;
  const gap = window.innerWidth <= 480 ? 3 : 4;
  cellW = w;
  cellH = h;

  fontSize = getFontSize();
  ctx.font = `${fontSize}px "Courier New", monospace`;
  const metrics = ctx.measureText('M');
  charW = metrics.width * (1 + 0.08);
  charH = fontSize * 1.15;

  particles = [];
  let xCursor = 0;

  for (let li = 0; li < WORD.length; li++) {
    const ch = WORD[li];
    const glyph = GLYPHS[ch];
    const cols = GLYPH_COLS[ch] || 5;

    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < cols; c++) {
        for (let dy = 0; dy < cellH; dy++) {
          for (let dx = 0; dx < cellW; dx++) {
            const filled = glyph[r][c] === 1;
            if (!filled) continue;

            const gridX = xCursor + c * cellW + dx;
            const gridY = r * cellH + dy;

            const seed = (li * 1000 + r * 100 + c * 10 + dy * 3 + dx) | 0;
            let rng = seed * 1664525 + 1013904223;
            rng = (rng * 1664525 + 1013904223) & 0xffffffff;
            const rand = (rng >>> 0) / 0xffffffff;
            const char = FILL_CHARS[Math.floor(rand * FILL_CHARS.length)];

            particles.push({
              gridX,
              gridY,
              char,
              baseChar: char,
              ox: gridX * charW,
              oy: gridY * charH,
              x: gridX * charW,
              y: gridY * charH,
              vx: 0,
              vy: 0,
              opacity: 1,
            });
          }
        }
      }
    }

    xCursor += cols * cellW + gap;
  }

  const totalW = xCursor * charW - gap * charW;
  const totalH = ROWS * cellH * charH;

  canvas.width = Math.ceil(totalW);
  canvas.height = Math.ceil(totalH);
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';

  const rect = canvas.getBoundingClientRect();
  canvasOffsetX = rect.left;
  canvasOffsetY = rect.top;

  canvas.style.opacity = '1';
}

function updateOffsets() {
  const rect = canvas.getBoundingClientRect();
  canvasOffsetX = rect.left;
  canvasOffsetY = rect.top;
}

function animate() {
  requestAnimationFrame(animate);
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const localMX = mouseX - canvasOffsetX;
  const localMY = mouseY - canvasOffsetY;

  ctx.font = `${fontSize}px "Courier New", monospace`;

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];

    const dx = p.x - localMX;
    const dy = p.y - localMY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < REPEL_RADIUS && dist > 0) {
      const t = 1 - dist / REPEL_RADIUS;
      const force = t * t * REPEL_STRENGTH;
      p.vx += (dx / dist) * force * dist * 0.15;
      p.vy += (dy / dist) * force * dist * 0.15;
    }

    if (Math.random() < 0.003) {
      p.char = SHIMMER_CHARS[Math.floor(Math.random() * SHIMMER_CHARS.length)];
    }

    const rx = p.ox - p.x;
    const ry = p.oy - p.y;
    p.vx += rx * RETURN_SPEED;
    p.vy += ry * RETURN_SPEED;
    p.vx *= DAMPING;
    p.vy *= DAMPING;
    p.x += p.vx;
    p.y += p.vy;

    const dispDist = Math.sqrt((p.x - p.ox) ** 2 + (p.y - p.oy) ** 2);
    const alpha = Math.max(0.25, 1 - (dispDist / 30) * 0.5);

    ctx.fillStyle = `rgba(232, 232, 232, ${alpha})`;
    ctx.fillText(p.char, p.x, p.y + fontSize);
  }
}

window.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  updateOffsets();
});

window.addEventListener('mouseleave', () => {
  mouseX = -9999;
  mouseY = -9999;
});

window.addEventListener('touchstart', (e) => {
  isTouching = true;
  const touch = e.touches[0];
  mouseX = touch.clientX;
  mouseY = touch.clientY;
  updateOffsets();
}, { passive: true });

window.addEventListener('touchmove', (e) => {
  const touch = e.touches[0];
  mouseX = touch.clientX;
  mouseY = touch.clientY;
  updateOffsets();
}, { passive: true });

window.addEventListener('touchend', () => {
  isTouching = false;
  setTimeout(() => {
    if (!isTouching) {
      mouseX = -9999;
      mouseY = -9999;
    }
  }, 600);
}, { passive: true });

window.addEventListener('resize', () => {
  buildParticles();
});

window.visualViewport && window.visualViewport.addEventListener('resize', () => {
  updateOffsets();
});

requestAnimationFrame(() => {
  buildParticles();
  animate();
});