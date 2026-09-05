(() => {
  "use strict";

  // Compatibility patch for the original Heartglass V1 script.
  // V1's text formatter knows {name} but omitted the capitalized {Name}
  // token, which can leave the literal placeholder visible in dialogue.
  function currentDateableName() {
    for (const key of ["heartglass_run_v2", "heartglass_run_v1"]) {
      try {
        const state = JSON.parse(localStorage.getItem(key));
        if (state && state.route === "male") return "Caelan";
        if (state && state.route === "female") return "Caelia";
      } catch (_) {}
    }
    return null;
  }

  function replaceNameTokens(root) {
    if (!root) return;
    const name = currentDateableName();
    if (!name) return;

    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    for (const textNode of nodes) {
      if (textNode.nodeValue && textNode.nodeValue.includes("{Name}")) {
        textNode.nodeValue = textNode.nodeValue.replaceAll("{Name}", name);
      }
    }
  }

  function sweep() {
    ["storyText", "choices", "speaker", "nameplate"].forEach(id => {
      replaceNameTokens(document.getElementById(id));
    });
  }

  function start() {
    const targets = ["storyText", "choices", "speaker", "nameplate"]
      .map(id => document.getElementById(id))
      .filter(Boolean);

    const observer = new MutationObserver(() => sweep());
    for (const target of targets) {
      observer.observe(target, { childList: true, subtree: true, characterData: true });
    }

    sweep();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
