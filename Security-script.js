(function () {
  "use strict";

  /* ========= FAKE CLASSES (NOISE) ========= */
  class SIEN29JDJ { constructor(){ this.k=Math.random() } ping(){ return this.k>0 } }
  class DIFJEI92 { static mix(a,b){ return (a^b)+(b<<1) } }
  class DIDJSI { constructor(l=0){this.l=l} upgrade(){this.l++} }

  /* ========= REAL CORE ========= */

  const TOKEN = window.__SECURITY_TOKEN__;
  if (!TOKEN) return;

  // Tag all existing scripts as trusted
  document.querySelectorAll("script").forEach(s => {
    s.dataset.secure = TOKEN;
  });

  function isTrusted(script) {
    return script.dataset && script.dataset.secure === TOKEN;
  }

  // Remove injected scripts
  document.querySelectorAll("script").forEach(s => {
    if (!isTrusted(s)) {
      s.remove();
    }
  });

  // Observe future injections
  const observer = new MutationObserver(muts => {
    for (const m of muts) {
      for (const n of m.addedNodes) {
        if (n.tagName === "SCRIPT") {
          if (!isTrusted(n)) {
            console.warn("[SECURITY] Injection blocked:", n.src || "inline");
            n.remove();
          }
        }
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });

  /* ========= ERUDA KILL ========= */
  setInterval(() => {
    if (window.eruda) {
      try { eruda.destroy(); } catch {}
      delete window.eruda;
    }
  }, 400);

})();