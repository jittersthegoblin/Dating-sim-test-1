(() => {
  "use strict";

  // Dialogue polish layer. This only adjusts visible wording; it does not
  // change routes, flags, stats, consequences, or ending requirements.

  const replacements = [
    ["Help seriously: compare the markings on the pendant to the diagrams.", "Pull a volume closer and compare the pendant’s markings to the diagrams."],
    ["Accept the instruction normally.", "Nod and let them show you the proper stance."],
    ["Take the challenge seriously and do your best.", "Square your shoulders. “All right. One clean try.”"],
    ["Apologize without asking them to forgive you.", "“I crossed a line. I’m sorry. I don’t expect that to fix it.”"],
    ["No disappointment. No teasing. Just another method.", "The change is accepted without fuss, and the lesson simply continues."],
    ["No expectation follows it.", "The quiet that follows is easy rather than expectant."],
    ["No disappointment becomes punishment. No affection is withdrawn.", "The ring disappears into their palm, but the warmth in their expression does not."],
    ["Wanting something eventually does not grant you permission now.", "Wanting something someday does not make this moment yours to take."],
    ["There is nothing to forgive. You asked a question without words. I answered it.", "You stopped when I asked. That matters more than guessing perfectly."],
    ["Thank you for making me explain instead of simply obey.", "Thank you for asking me to explain. I forget that authority is a poor substitute for trust."],
    ["You are my friend. That is not a lesser thing because it is not romance.", "You are my friend. Do not mistake that for a smaller word."],
    ["Among my people, a promise like this is not ownership. It is an invitation renewed every day.", "Among my people, this ring is not a claim. It means I intend to choose you tomorrow—and, if you allow me, the day after that."],
    ["People die. You should be used to it by now.", "You’ve lived this long. Haven’t you learned not to get attached?"],
    ["Pretend to be helpless so they will keep helping you.", "Deliberately botch the movement. “Maybe you should show me again.”"],
    ["Press for every detail of their past even when they hesitates.", "Keep pressing when they hesitate. “You can tell me. What happened?”"],
    ["Make a suggestive comment about them finding an excuse to touch you.", "“That’s a very elaborate excuse to get close to me.”"],
    ["“You are allowed to miss it,” they say. “I would be worried if you did not.”", "“Miss it,” they say. “I would think less of this place if it demanded you forget your own.”"]
  ];

  function polish(root) {
    if (!root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    for (const textNode of nodes) {
      if (!textNode.nodeValue) continue;
      let value = textNode.nodeValue;
      for (const [from, to] of replacements) {
        if (value.includes(from)) value = value.split(from).join(to);
      }
      if (value !== textNode.nodeValue) textNode.nodeValue = value;
    }
  }

  function sweep() {
    polish(document.getElementById("storyText"));
    polish(document.getElementById("choices"));
  }

  function start() {
    const app = document.getElementById("app") || document.body;
    const observer = new MutationObserver(sweep);
    observer.observe(app, { childList: true, subtree: true, characterData: true });
    sweep();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
