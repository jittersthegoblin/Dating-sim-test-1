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
    // Leave two-choice setup questions (including romance gender selection)
    // alone. The pattern problem only matters once there are 3+ choices.
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

    // The game displays the choice number from data-key, so renumber after
    // moving the buttons to keep 1 / 2 / 3 visually correct.
    Array.from(container.querySelectorAll(":scope > button.choice-btn")).forEach((btn, index) => {
      btn.dataset.key = String(index + 1);
    });
  }

  function sweep() {
    repairVisiblePlaceholders(document.getElementById("storyText"));
    repairVisiblePlaceholders(document.getElementById("choices"));
    repairVisiblePlaceholders(document.getElementById("speaker"));
    rebalanceChoiceOrder();
  }

  function start() {
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
