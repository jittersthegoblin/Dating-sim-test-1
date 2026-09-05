(() => {
  "use strict";

  // Heartglass V1 compatibility layer.
  // From this build onward, both Caelan and Caelia use they/them/their pronouns
  // in narration. Their names and gendered partner titles still stay distinct.

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

      // Some original V1 prose accidentally used {Name}, which the formatter
      // never defined. Treat those as pronouns instead of names.
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

  function sweep() {
    repairVisiblePlaceholders(document.getElementById("storyText"));
    repairVisiblePlaceholders(document.getElementById("choices"));
    repairVisiblePlaceholders(document.getElementById("speaker"));
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
