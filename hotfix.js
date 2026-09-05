(() => {
  "use strict";

  // Heartglass compatibility patch for the original V1 formatter.
  // V1 supports {name} but some story lines use {Name}.
  // Prefer the visible nameplate (most reliable), then fall back to save data.
  function currentDateableName() {
    const plate = document.getElementById("nameplate");
    const visibleName = plate && plate.textContent ? plate.textContent.trim() : "";
    if (visibleName === "Caelan" || visibleName === "Caelia") return visibleName;

    for (const key of ["heartglass_run_v2", "heartglass_run_v1"]) {
      try {
        const state = JSON.parse(localStorage.getItem(key));
        if (state && state.route === "male") return "Caelan";
        if (state && state.route === "female") return "Caelia";
      } catch (_) {}
    }
    return null;
  }

  function replaceTokens(root) {
    if (!root) return;
    const name = currentDateableName();
    if (!name) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);

    for (const textNode of nodes) {
      if (!textNode.nodeValue) continue;
      let value = textNode.nodeValue;
      if (value.includes("{Name}")) value = value.replaceAll("{Name}", name);
      if (value.includes("{NAME}")) value = value.replaceAll("{NAME}", name.toUpperCase());
      if (value !== textNode.nodeValue) textNode.nodeValue = value;
    }
  }

  function sweep() {
    replaceTokens(document.getElementById("storyText"));
    replaceTokens(document.getElementById("choices"));
    replaceTokens(document.getElementById("speaker"));
  }

  function start() {
    const app = document.getElementById("app") || document.body;
    const observer = new MutationObserver(sweep);
    observer.observe(app, { childList: true, subtree: true, characterData: true });

    // Immediate sweep and a brief fallback interval cover already-rendered text
    // and any browser/GitHub Pages timing differences.
    sweep();
    let runs = 0;
    const timer = setInterval(() => {
      sweep();
      runs += 1;
      if (runs >= 40) clearInterval(timer);
    }, 250);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
