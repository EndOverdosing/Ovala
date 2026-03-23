"use strict";

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById("uv-form");
  const address = document.getElementById("uv-address");
  const searchEngine = document.getElementById("uv-search-engine");
  const error = document.getElementById("uv-error");
  const errorCode = document.getElementById("uv-error-code");

  if (form) {
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
  }

  const clockEl = document.getElementById('clock');
  if (clockEl) {
    function tick() {
      clockEl.textContent = new Date().toLocaleTimeString('en-US', { hour12: false });
    }
    tick();
    setInterval(tick, 1000);
  }

  const siteLabel = document.querySelector('.site-label');
  if (siteLabel) {
    siteLabel.parentNode.insertBefore(titleElement, siteLabel.nextSibling);
  }
});

const logo = document.getElementById('text');
logo.innerHTML = logo.textContent
  .split('')
  .map(char => `<span>${char}</span>`)
  .join('');

const spans = Array.from(logo.querySelectorAll('span'));
const shuffled = spans.sort(() => Math.random() - 0.5);

shuffled.forEach((span, i) => {
  setTimeout(() => {
    span.style.opacity = '1';
    span.style.filter = 'blur(0px)';
  }, i * 500 + Math.random() * 500);
});