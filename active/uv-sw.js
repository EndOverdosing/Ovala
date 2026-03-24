importScripts("/active/uv/uv.bundle.js");
importScripts("/active/uv/uv.config.js");
importScripts("/active/uv/uv.sw.js");

const sw = new UVServiceWorker();

const OVERLAY_CSS = `
#__ov-pill-wrap {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 44px;
  max-width: 95%;
  width: auto;
  background: #000;
  border: 1px solid #fff;
  border-radius: 0;
  padding: 0 6px;
  font-family: "Courier New", Courier, monospace;
  color: #fff;
  white-space: nowrap;
  pointer-events: all;
  animation: __ov-rise 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

#__ov-pill-wrap * {
  box-sizing: border-box;
  font-family: "Courier New", Courier, monospace;
  color: #fff;
}

#__ov-input {
  width: 140px;
  max-width: 80vw;
  height: 32px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid #fff;
  border-radius: 0;
  color: #fff;
  font-size: 11.5px;
  padding: 0 14px;
  outline: none;
  caret-color: #fff;
  transition: width 0.25s ease;
}

#__ov-input:focus {
  width: 70vw;
}

/* Buttons */
.ov-btn {
  background: none;
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.ov-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
}

/* Divider */
.ov-divider {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.3);
  margin: 0 2px;
}

/* Mobile adjustments */
@media (max-width: 480px) {
  #__ov-pill-wrap {
    bottom: 8px;
    height: 40px;
    padding: 0 4px;
  }

  #__ov-input {
    width: 120px;
  }

  #__ov-input:focus {
    width: 65vw;
  }

  .ov-btn {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }

  .ov-divider {
    height: 16px;
  }
}
`;

const OVERLAY_JS = `
(function(){
  if(document.getElementById("__ov-pill-wrap"))return;

  const PREFIX="/active/go/";

  var s=document.createElement("style");
  s.textContent=${JSON.stringify(OVERLAY_CSS)};
  document.head.appendChild(s);

  var wrap=document.createElement("div");
  wrap.id="__ov-pill-wrap";
  wrap.innerHTML='<button class="ov-btn" id="__ov-back" title="Back">&#8592;</button><button class="ov-btn" id="__ov-fwd" title="Forward">&#8594;</button><button class="ov-btn" id="__ov-reload" title="Reload">&#8635;</button><div class="ov-divider"></div><input id="__ov-input" type="text" placeholder="search or enter url..." autocomplete="off" spellcheck="false"/><div class="ov-divider"></div><button class="ov-btn" id="__ov-home" title="Home" style="font-size:13px;">~</button>';
  document.documentElement.appendChild(wrap);

  function xor(str){return str.split("").map(function(c){return String.fromCharCode(c.charCodeAt(0)^2);}).join("");}

  function decodeUrl(){
    try{
      var encoded=location.pathname.slice(PREFIX.length)+location.search+location.hash;
      return xor(decodeURIComponent(encoded));
    }catch(e){return location.href;}
  }

  function syncInput(){
    var i=document.getElementById("__ov-input");
    if(i&&document.activeElement!==i)i.value=decodeUrl();
  }

  function syncNav(){
    var b=document.getElementById("__ov-back");
    if(b)b.disabled=history.length<=1;
  }

  function navigate(raw){
    var url;
    try{url=new URL(raw).toString();}catch(e){}
    if(!url){try{var u=new URL("http://"+raw);if(u.hostname.includes("."))url=u.toString();}catch(e){}}
    if(!url)url="https://duckduckgo.com/?q="+encodeURIComponent(raw);
    location.href=PREFIX+encodeURIComponent(xor(url));
  }

  syncInput();
  syncNav();

  wrap.addEventListener("click",function(e){
    var t=e.target.closest(".ov-btn");
    if(!t)return;
    if(t.id==="__ov-back"){history.back();setTimeout(syncInput,120);}
    if(t.id==="__ov-fwd"){history.forward();setTimeout(syncInput,120);}
    if(t.id==="__ov-reload"){location.reload();}
    if(t.id==="__ov-home"){location.href="/";}
  });

  document.addEventListener("keydown",function(e){
    var i=document.getElementById("__ov-input");
    if(!i)return;
    if(e.target===i&&e.key==="Enter"){e.preventDefault();navigate(i.value.trim());}
    if(e.key==="Escape"&&document.activeElement===i){i.blur();syncInput();}
  });

  var _push=history.pushState.bind(history);
  var _replace=history.replaceState.bind(history);
  history.pushState=function(){_push.apply(history,arguments);setTimeout(syncInput,60);setTimeout(syncNav,60);};
  history.replaceState=function(){_replace.apply(history,arguments);setTimeout(syncInput,60);};
  window.addEventListener("popstate",function(){setTimeout(syncInput,60);setTimeout(syncNav,60);});
})();
`;

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("fetch", (event) => {
  event.respondWith(
    sw.fetch(event).then(async (res) => {
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("text/html")) return res;

      const html = await res.text();
      if (html.includes("__ov-pill-wrap")) return new Response(html, {
        status: res.status, statusText: res.statusText, headers: res.headers
      });

      const tag = `<script>${OVERLAY_JS}<\/script>`;
      let injected;
      if (/<\/body>/i.test(html)) {
        injected = html.replace(/<\/body>/i, tag + "</body>");
      } else if (/<\/html>/i.test(html)) {
        injected = html.replace(/<\/html>/i, tag + "</html>");
      } else {
        injected = html + tag;
      }

      const headers = new Headers(res.headers);
      headers.delete("content-security-policy");
      headers.delete("content-security-policy-report-only");
      headers.set("content-type", "text/html; charset=utf-8");

      return new Response(injected, {
        status: res.status,
        statusText: res.statusText,
        headers,
      });
    })
  );
});