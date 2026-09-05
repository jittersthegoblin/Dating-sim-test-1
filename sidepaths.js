(() => {
  "use strict";

  const RUN_KEY = "heartglass_run_v1";
  const SIDE_KEY = "heartglass_sidepaths_v1";

  function readJson(key, fallback) {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function currentRun() {
    return readJson(RUN_KEY, null);
  }

  function runId(run) {
    return run && run.startedAt ? String(run.startedAt) : "unknown";
  }

  function nameFor(run) {
    return run?.route === "female" ? "Caelia" : "Caelan";
  }

  function readSideState(run) {
    const all = readJson(SIDE_KEY, {});
    return all[runId(run)] || null;
  }

  function writeSideState(run, patch) {
    const all = readJson(SIDE_KEY, {});
    const id = runId(run);
    all[id] = {
      route: run.route,
      startedAt: run.startedAt,
      ...(all[id] || {}),
      ...patch
    };
    localStorage.setItem(SIDE_KEY, JSON.stringify(all));
    return all[id];
  }

  function button(label, onClick, className = "choice-btn") {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = className;
    btn.textContent = label;
    btn.addEventListener("click", onClick);
    return btn;
  }

  function p(text) {
    const el = document.createElement("p");
    el.textContent = text;
    return el;
  }

  function hideBase(panel) {
    const ids = ["speaker", "storyText", "choices", "continueStoryBtn"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!Object.prototype.hasOwnProperty.call(el.dataset, "sidepathDisplay")) {
        el.dataset.sidepathDisplay = el.style.display || "";
      }
      el.style.display = "none";
    });
    panel.hidden = false;
  }

  function restoreBase(panel) {
    const ids = ["speaker", "storyText", "choices", "continueStoryBtn"];
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.style.display = el.dataset.sidepathDisplay || "";
      delete el.dataset.sidepathDisplay;
    });
    panel.remove();
  }

  function makePanel(run) {
    const dialogue = document.querySelector(".dialogue-card");
    if (!dialogue) return null;

    let panel = document.getElementById("sidepathPanel");
    if (panel) return panel;

    panel = document.createElement("section");
    panel.id = "sidepathPanel";
    panel.className = "sidepath-panel";
    panel.dataset.runId = runId(run);
    dialogue.appendChild(panel);
    return panel;
  }

  function clearPanel(panel) {
    panel.innerHTML = "";
  }

  function addHeader(panel, eyebrow, title) {
    const small = document.createElement("p");
    small.className = "eyebrow";
    small.textContent = eyebrow;
    const h = document.createElement("h3");
    h.textContent = title;
    panel.append(small, h);
  }

  function addChoices(panel, choices) {
    const wrap = document.createElement("div");
    wrap.className = "choices sidepath-choices";
    choices.forEach(c => wrap.appendChild(button(c.label, c.onClick)));
    panel.appendChild(wrap);
  }

  function finish(run, panel, routeName) {
    writeSideState(run, { completed: true, active: false, routeName, stage: "done" });
    restoreBase(panel);
  }

  function renderHub(run, panel) {
    const name = nameFor(run);
    writeSideState(run, { active: true, stage: "hub" });
    clearPanel(panel);
    addHeader(panel, "Optional interlude", "One Free Afternoon");
    panel.append(
      p(`The next day, the library closes around you in a rustle of floating pages. ${name} shuts the final volume with visible satisfaction.`),
      p(`“Before the garden, I have several hours in which nobody is presently on fire, cursed, missing, or attempting to cross dimensions.” They glance toward the windows. “This is sufficiently rare that I feel obligated to misuse it.”`),
      p(`They offer you three possibilities. You will only have time for one.`)
    );

    addChoices(panel, [
      { label: "Visit the twilight market beyond the castle gates.", onClick: () => chooseRoute(run, panel, "market") },
      { label: "Explore the castle glasshouse and its impossible plants.", onClick: () => chooseRoute(run, panel, "glasshouse") },
      { label: "Climb to the abandoned observatory above the west tower.", onClick: () => chooseRoute(run, panel, "observatory") },
      { label: "Save the quiet afternoon and go straight to the garden.", onClick: () => finish(run, panel, "skipped") }
    ]);
  }

  function chooseRoute(run, panel, routeName) {
    writeSideState(run, { routeName, stage: "part1" });
    renderRoute(run, panel, routeName, "part1");
  }

  function renderRoute(run, panel, routeName, stage, response = null) {
    if (routeName === "market") return renderMarket(run, panel, stage, response);
    if (routeName === "glasshouse") return renderGlasshouse(run, panel, stage, response);
    return renderObservatory(run, panel, stage, response);
  }

  function renderMarket(run, panel, stage, response) {
    const name = nameFor(run);
    clearPanel(panel);
    addHeader(panel, "Optional interlude", "The Twilight Market");

    if (stage === "part1") {
      panel.append(
        p(`The market appears only after the sun drops behind the valley. Lanterns shaped like seedpods hang over narrow lanes, and every stall seems to sell something that should require a warning label.`),
        p(`${name} keeps close without hovering. A merchant with silver antlers immediately tries to sell you a tiny glass bottle containing what they insist is “a perfectly domesticated thunderstorm.”`),
        p(`“Do not buy weather from anyone who describes it as domesticated,” ${name} murmurs. “I learned that during an unfortunate decade.”`)
      );
      addChoices(panel, [
        { label: "“An unfortunate decade? You are absolutely telling me that story.”", onClick: () => marketResponse(run, panel, "story") },
        { label: "Ask the merchant what the thunderstorm eats.", onClick: () => marketResponse(run, panel, "storm") },
        { label: `Let ${name} choose one harmless thing for you to take home.`, onClick: () => marketResponse(run, panel, "gift") }
      ]);
      return;
    }

    const text = response === "story"
      ? `You refuse to let the phrase “unfortunate decade” pass without explanation. ${name} lasts perhaps thirty seconds before admitting that, centuries ago, they accidentally bought a rain charm that followed them indoors for nine years. Their dignity does not survive your laughter.`
      : response === "storm"
        ? `The merchant answers with complete seriousness: “Applause, copper, and unresolved family tension.” ${name} closes their eyes. “We are leaving this stall before you ask a follow-up question.” You ask two.`
        : `${name} studies half the market with absurd care before buying a small moon-white charm carved like two overlapping doors. “Harmless,” they say. Then, after a pause, “And perhaps a little sentimental. Do not become unbearable about it.”`;

    panel.append(
      p(text),
      p(`On the walk back, ${name} is less Warden than companion—laughing more easily, stopping to point out ridiculous shop signs, and arguing with you about which human objects would be most alarming if sold in a fae market.`),
      p(`By the time the castle lights come into view, the strange world feels slightly less like somewhere you fell into and slightly more like somewhere you have begun to know.`)
    );
    addChoices(panel, [{ label: "Continue to the Moon Garden.", onClick: () => finish(run, panel, "market") }]);
  }

  function marketResponse(run, panel, response) {
    writeSideState(run, { stage: "part2", response });
    renderMarket(run, panel, "part2", response);
  }

  function renderGlasshouse(run, panel, stage, response) {
    const name = nameFor(run);
    clearPanel(panel);
    addHeader(panel, "Optional interlude", "The Living Glasshouse");

    if (stage === "part1") {
      panel.append(
        p(`The glasshouse is warmer than the rest of the castle and far larger on the inside than the roof suggests. Vines crawl lazily along copper trellises. Flowers fold themselves shut when you look directly at them and reopen the moment you turn away.`),
        p(`${name} points toward a cluster of pale blue leaves. “Those repeat the last kind thing said near them.”`),
        p(`One leaf rustles and whispers, in ${name}’s own voice, “You truly do want to understand this place.” They go completely still.`)
      );
      addChoices(panel, [
        { label: "Pretend you heard absolutely nothing.", onClick: () => glasshouseResponse(run, panel, "mercy") },
        { label: "“Oh, I am going to treasure this plant forever.”", onClick: () => glasshouseResponse(run, panel, "tease") },
        { label: "Tell the leaves something kind about them too.", onClick: () => glasshouseResponse(run, panel, "kind") }
      ]);
      return;
    }

    const text = response === "mercy"
      ? `${name} gives you a grateful look that would be more convincing if the tips of their ears had not turned bright red. You study a fern with heroic concentration until they recover.`
      : response === "tease"
        ? `${name} points a warning finger at you. “If a cutting of that plant appears in my study, I will know exactly who committed the crime.” The leaves repeat “treasure this plant forever” in your voice until both of you are laughing.`
        : `You lean toward the leaves and say, quietly, “They make impossible things feel less frightening.” For a moment the glasshouse goes still. Then the plant repeats it back in your voice. ${name} looks away, thoroughly defeated by botany.`;

    panel.append(
      p(text),
      p(`Farther inside, you find a vine that curls around wrists only when someone is calm. ${name} offers their hand to demonstrate. The vine coils once around their fingers, then stretches experimentally toward you.`),
      p(`“Apparently,” ${name} says, “the plants have decided to involve themselves in my personal affairs.”`)
    );
    addChoices(panel, [{ label: "Leave the glasshouse together and continue to the garden.", onClick: () => finish(run, panel, "glasshouse") }]);
  }

  function glasshouseResponse(run, panel, response) {
    writeSideState(run, { stage: "part2", response });
    renderGlasshouse(run, panel, "part2", response);
  }

  function renderObservatory(run, panel, stage, response) {
    const name = nameFor(run);
    clearPanel(panel);
    addHeader(panel, "Optional interlude", "The Old Observatory");

    if (stage === "part1") {
      panel.append(
        p(`The west tower staircase has enough steps to make you suspect the architect held a private grudge against knees. At the top, a bronze dome opens onto the violet evening sky.`),
        p(`Dusty star maps cover the walls. Some constellations resemble the ones you know; others rearrange themselves when ${name} touches their names.`),
        p(`“Wardens used to navigate by these,” they explain. “Before the veil became predictable enough for instruments. We learned the sky the way sailors learn coastlines.”`)
      );
      addChoices(panel, [
        { label: "Ask which constellation is their favorite.", onClick: () => observatoryResponse(run, panel, "favorite") },
        { label: "Find a human constellation and teach it to them.", onClick: () => observatoryResponse(run, panel, "human") },
        { label: "“So this is where ancient Wardens came to brood dramatically?”", onClick: () => observatoryResponse(run, panel, "brood") }
      ]);
      return;
    }

    const text = response === "favorite"
      ? `${name} chooses a small seven-star pattern near the horizon. “The Lantern-Bearer. It is supposed to guide travelers who cannot see the road yet.” They realize what they have admitted only after you smile at them.`
      : response === "human"
        ? `You find a familiar pattern and trace it against the glass. ${name} listens with the attention of someone being handed a map to a world they may someday visit. When you finish, they repeat the name carefully until it sounds right.`
        : `${name} gives you a wounded look. “We did not brood.” A beat passes. “We contemplated with unnecessary coats.” You laugh so loudly it echoes down the tower.`;

    panel.append(
      p(text),
      p(`Before you leave, the old lens turns by itself and throws a ribbon of starlight across the floor. For an instant it lands on the Heartglass at your chest, and the relic answers with a quiet pulse.`),
      p(`${name} notices, but this time neither of you immediately turns the moment into research. You simply stand together beneath the turning sky.`)
    );
    addChoices(panel, [{ label: "Head back down together and continue to the garden.", onClick: () => finish(run, panel, "observatory") }]);
  }

  function observatoryResponse(run, panel, response) {
    writeSideState(run, { stage: "part2", response });
    renderObservatory(run, panel, "part2", response);
  }

  function resumeStored(run, panel, state) {
    if (!state || state.completed) return;
    if (!state.routeName || state.stage === "hub") return renderHub(run, panel);
    renderRoute(run, panel, state.routeName, state.stage || "part1", state.response || null);
  }

  function maybeShowSidePath() {
    const run = currentRun();
    const existing = document.getElementById("sidepathPanel");

    if (!run || run.ended || !run.route || run.scene !== "garden_walk") {
      if (existing) restoreBase(existing);
      return;
    }

    const state = readSideState(run);
    if (state?.completed) {
      if (existing) restoreBase(existing);
      return;
    }

    const panel = makePanel(run);
    if (!panel) return;
    hideBase(panel);

    if (panel.dataset.rendered === "true") return;
    panel.dataset.rendered = "true";
    resumeStored(run, panel, state);
  }

  function installStyles() {
    if (document.getElementById("heartglass-sidepath-style")) return;
    const style = document.createElement("style");
    style.id = "heartglass-sidepath-style";
    style.textContent = `
      .sidepath-panel h3 {
        margin: 0.2rem 0 1rem;
        font-size: clamp(1.45rem, 3vw, 2rem);
      }
      .sidepath-panel p {
        line-height: 1.72;
      }
      .sidepath-choices {
        margin-top: 1.15rem;
      }
    `;
    document.head.appendChild(style);
  }

  function start() {
    installStyles();
    const app = document.getElementById("app") || document.body;
    const observer = new MutationObserver(maybeShowSidePath);
    observer.observe(app, { childList: true, subtree: true, characterData: true });
    maybeShowSidePath();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();