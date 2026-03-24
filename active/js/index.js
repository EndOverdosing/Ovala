"use strict";

(async () => {
  if (
    (location.protocol === "https:" || ["localhost", "127.0.0.1"].includes(location.hostname)) &&
    navigator.serviceWorker
  ) {
    const reg = await navigator.serviceWorker.register("/active/uv-sw.js", {
      scope: __uv$config.prefix,
    });

    const needsClaim = !navigator.serviceWorker.controller;

    if (needsClaim) {
      await new Promise((resolve) => {
        navigator.serviceWorker.addEventListener("controllerchange", resolve, { once: true });
      });

      sessionStorage.setItem("__ov_claimed", "1");
      location.reload();
      return;
    }
  }
})();

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById("uv-form");
  const address = document.getElementById("uv-address");
  const searchEngine = document.getElementById("uv-search-engine");

  if (form) {
    form.addEventListener("submit", async (event) => {
      event.preventDefault();
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
});

const logoEl = document.getElementById('text');
if (logoEl) {
  logoEl.innerHTML = logoEl.textContent
    .split('')
    .map(char => `<span>${char}</span>`)
    .join('');

  const spans = Array.from(logoEl.querySelectorAll('span'));
  const shuffled = spans.sort(() => Math.random() - 0.5);

  shuffled.forEach((span, i) => {
    setTimeout(() => {
      span.style.opacity = '1';
      span.style.filter = 'blur(0px)';
    }, i * 500 + Math.random() * 500);
  });
}