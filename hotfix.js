(() => {
  "use strict";

  // Heartglass compatibility layer.
  // Both Caelan and Caelia use they/them/their pronouns in narration while
  // keeping their distinct names and gendered relationship titles.

  const nativeReplaceAll = String.prototype.replaceAll;
  if (!String.prototype.__heartglassNeutralPronouns) {
    Object.defineProperty(String.prototype, "__heartglassNeutralPronouns", {
      value: true,
      configurable: false,
      enumerable: false
    });

    String.prototype.replaceAll = function (search, replacement) {
      const neutral = {
        "{subj}": "they",
        "{Subj}": "They",
        "{obj}": "them",
        "{Obj}": "Them",
        "{poss}": "their",
        "{Poss}": "Their",
        "{reflexive}": "themselves"
      };

      if (typeof search === "string" && Object.prototype.hasOwnProperty.call(neutral, search)) {
        replacement = neutral[search];
      }

      let result = nativeReplaceAll.call(String(this), search, replacement);
      result = nativeReplaceAll.call(result, "{Name}’s", "Their");
      result = nativeReplaceAll.call(result, "{Name}'s", "Their");
      result = nativeReplaceAll.call(result, "{Name}", "They");
      result = nativeReplaceAll.call(result, "{NAME}", "THEY");
      return result;
    };
  }

  function repairVisiblePlaceholders(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) nodes.push(n);

    for (const textNode of nodes) {
      if (!textNode.nodeValue) continue;
      let value = textNode.nodeValue;
      value = nativeReplaceAll.call(value, "{Name}’s", "Their");
      value = nativeReplaceAll.call(value, "{Name}'s", "Their");
      value = nativeReplaceAll.call(value, "{Name}", "They");
      value = nativeReplaceAll.call(value, "{NAME}", "THEY");
      if (value !== textNode.nodeValue) textNode.nodeValue = value;
    }
  }

  // --- Choice presentation balancing -------------------------------------
  // The original story data and every consequence remain untouched. We only
  // move the already-created choice buttons into a stable, scene-specific
  // order. Moving DOM nodes preserves their original click handlers, effects,
  // flags and destinations, so this cannot change which choice does what.

  function hashString(input) {
    let h = 2166136261;
    for (let i = 0; i < input.length; i += 1) {
      h ^= input.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function mixedOrder(buttons, seed) {
    if (buttons.length === 3) {
      const permutations = [
        [0, 1, 2],
        [1, 0, 2],
        [1, 2, 0],
        [2, 0, 1],
        [2, 1, 0],
        [0, 2, 1]
      ];
      return permutations[seed % permutations.length].map(i => buttons[i]);
    }

    const result = buttons.slice();
    let state = seed || 1;
    for (let i = result.length - 1; i > 0; i -= 1) {
      state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
      const j = state % (i + 1);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function rebalanceChoiceOrder() {
    const container = document.getElementById("choices");
    if (!container) return;

    const buttons = Array.from(container.querySelectorAll(":scope > button.choice-btn"));
    if (buttons.length < 3) return;

    const ids = buttons.map(btn => btn.dataset.choiceId || btn.textContent.trim()).sort().join("|");
    const chapter = document.getElementById("chapterLabel")?.textContent || "";
    const location = document.getElementById("locationLabel")?.textContent || "";
    const story = document.getElementById("storyText")?.textContent || "";
    const fingerprint = `${chapter}|${location}|${story}|${ids}`;
    const marker = String(hashString(fingerprint));

    if (container.dataset.hgBalancedFor === marker) return;
    container.dataset.hgBalancedFor = marker;

    const ordered = mixedOrder(buttons, hashString(fingerprint + "|Heartglass"));
    const fragment = document.createDocumentFragment();
    ordered.forEach(btn => fragment.appendChild(btn));
    container.appendChild(fragment);

    Array.from(container.querySelectorAll(":scope > button.choice-btn")).forEach((btn, index) => {
      btn.dataset.key = String(index + 1);
    });
  }

  // --- Ending illustrations ----------------------------------------------
  // Every ending now uses a full ending CG. The player is never visibly shown.

  function currentRun() {
    try {
      return JSON.parse(localStorage.getItem("heartglass_run_v1"));
    } catch (_) {
      return null;
    }
  }

  function endingArtFor(run) {
    if (!run || !run.route) return null;
    const match = /^ending_(enemy|neutral|friend|romance|engaged|marriage)$/.exec(run.scene || "");
    if (!match) return null;

    const ending = match[1];
    const name = run.route === "male" ? "Caelan" : "Caelia";
    const descriptions = {
      enemy: `${name} looks sadly back through the portal with their arms crossed.`,
      neutral: `${name} gives a calm, polite wave through the portal.`,
      friend: `${name} smiles and waves warmly through the portal.`,
      romance: `${name} looks up from a book, delighted that the player has returned.`,
      engaged: `${name} looks up from a book with a deeply loving expression as the player returns.`,
      marriage: `${name} waits at the fae wedding altar in wedding attire, holding out their hand toward the player.`
    };

    return {
      ending,
      src: `assets/endings/${run.route}_${ending}.webp`,
      alt: descriptions[ending]
    };
  }

  function installEndingArtStyles() {
    if (document.getElementById("heartglass-ending-art-style")) return;
    const style = document.createElement("style");
    style.id = "heartglass-ending-art-style";
    style.textContent = `
      .ending-scene-art-wrap {
        margin: 0 0 1.15rem;
        border-radius: 18px;
        overflow: hidden;
        border: 1px solid rgba(218, 187, 105, 0.34);
        background: rgba(5, 17, 13, 0.65);
        box-shadow: 0 16px 38px rgba(0, 0, 0, 0.26);
      }
      .ending-scene-art {
        display: block;
        width: 100%;
        height: auto;
        max-height: 62vh;
        object-fit: contain;
      }
      .ending-scene-art-wrap[data-ending="marriage"] .ending-scene-art {
        max-height: 68vh;
        padding: 0.45rem;
      }
      .game-screen.ending-art-active .portrait-panel {
        display: none !important;
      }
      .game-screen.ending-art-active .story-stage {
        grid-template-columns: minmax(0, 1fr) !important;
      }
      @media (max-width: 720px) {
        .ending-scene-art-wrap { border-radius: 13px; }
        .ending-scene-art { max-height: none; }
      }
    `;
    document.head.appendChild(style);
  }

  function syncEndingArtwork() {
    const story = document.getElementById("storyText");
    const gameScreen = document.getElementById("gameScreen");
    if (!story || !gameScreen) return;

    const spec = endingArtFor(currentRun());
    const existing = story.querySelector(".ending-scene-art-wrap");

    if (!spec) {
      gameScreen.classList.remove("ending-art-active");
      if (existing) existing.remove();
      return;
    }

    gameScreen.classList.add("ending-art-active");
    if (existing && existing.dataset.src === spec.src) return;
    if (existing) existing.remove();

    const figure = document.createElement("figure");
    figure.className = "ending-scene-art-wrap";
    figure.dataset.src = spec.src;
    figure.dataset.ending = spec.ending;

    const img = document.createElement("img");
    img.className = "ending-scene-art";
    img.src = spec.src;
    img.alt = spec.alt;
    img.loading = "eager";
    img.decoding = "async";

    figure.appendChild(img);
    story.prepend(figure);
  }

  function sweep() {
    repairVisiblePlaceholders(document.getElementById("storyText"));
    repairVisiblePlaceholders(document.getElementById("choices"));
    repairVisiblePlaceholders(document.getElementById("speaker"));
    rebalanceChoiceOrder();
    syncEndingArtwork();
  }

  function start() {
    installEndingArtStyles();
    const app = document.getElementById("app") || document.body;
    const observer = new MutationObserver(sweep);
    observer.observe(app, { childList: true, subtree: true, characterData: true });
    sweep();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
