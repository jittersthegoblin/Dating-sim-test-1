(() => {
  "use strict";

  const RUN_KEY = "heartglass_run_v1";
  const FOREVER_KEY = "heartglass_forever_v1";
  const COST = 10;

  function defaults() {
    return {
      crystals: 0,
      unlocked: false,
      awardedRuns: {},
      viewed: { male: false, female: false }
    };
  }

  function readJson(key, fallback) {
    try {
      const parsed = JSON.parse(localStorage.getItem(key));
      return parsed ?? fallback;
    } catch (_) {
      return fallback;
    }
  }

  function loadForever() {
    const saved = readJson(FOREVER_KEY, {});
    const base = defaults();
    return {
      ...base,
      ...saved,
      crystals: Math.max(0, Math.min(COST, Number(saved.crystals) || 0)),
      awardedRuns: saved.awardedRuns && typeof saved.awardedRuns === "object" ? saved.awardedRuns : {},
      viewed: {
        ...base.viewed,
        ...(saved.viewed && typeof saved.viewed === "object" ? saved.viewed : {})
      }
    };
  }

  let forever = loadForever();

  function saveForever() {
    localStorage.setItem(FOREVER_KEY, JSON.stringify(forever));
  }

  function currentRun() {
    return readJson(RUN_KEY, null);
  }

  function awardCrystalIfNeeded() {
    if (forever.unlocked) return false;

    const run = currentRun();
    if (!run || !run.ended || !run.startedAt) return false;

    const id = String(run.startedAt);
    if (forever.awardedRuns[id]) return false;

    forever.awardedRuns[id] = true;
    forever.crystals = Math.min(COST, forever.crystals + 1);
    saveForever();
    renderWidget();
    return true;
  }

  function ensureWidget() {
    const titleCard = document.querySelector("#titleScreen .title-card");
    if (!titleCard) return null;

    let box = document.getElementById("foreverPathBox");
    if (box) return box;

    box = document.createElement("section");
    box.id = "foreverPathBox";
    box.className = "forever-path-box";
    box.setAttribute("aria-label", "Heartglass crystal progress");
    box.innerHTML = `
      <div class="forever-crystal-line">
        <span class="forever-crystal-icon" aria-hidden="true">✦</span>
        <span id="foreverCrystalText">Heartglass Crystals: 0 / ${COST}</span>
      </div>
      <p id="foreverHint" class="forever-hint"></p>
      <button id="foreverPathBtn" class="btn forever-path-btn" type="button"></button>
    `;

    titleCard.appendChild(box);
    box.querySelector("#foreverPathBtn").addEventListener("click", handleForeverButton);
    return box;
  }

  function renderWidget() {
    const box = ensureWidget();
    if (!box) return;

    const text = box.querySelector("#foreverCrystalText");
    const hint = box.querySelector("#foreverHint");
    const btn = box.querySelector("#foreverPathBtn");

    if (forever.unlocked) {
      text.textContent = "The Forever Path is unlocked ✦";
      hint.textContent = "The Heartglass remembers the final path you earned.";
      btn.disabled = false;
      btn.textContent = "Enter the Forever Path ✨";
      btn.classList.add("unlocked");
      return;
    }

    text.textContent = `Heartglass Crystals: ${forever.crystals} / ${COST}`;
    btn.classList.remove("unlocked");

    if (forever.crystals >= COST) {
      hint.textContent = "The Heartglass has gathered enough power to reveal one final path.";
      btn.disabled = false;
      btn.textContent = `Unlock the Secret Ending — ${COST} ✦`;
    } else {
      const remaining = COST - forever.crystals;
      hint.textContent = `${remaining} more completed ${remaining === 1 ? "journey" : "journeys"} until the secret can be unlocked.`;
      btn.disabled = true;
      btn.textContent = `Secret Ending — ${COST} ✦`;
    }
  }

  function handleForeverButton() {
    if (forever.unlocked) {
      showHeartChoice();
      return;
    }

    if (forever.crystals < COST) return;
    showPurchaseConfirm();
  }

  function makeOverlay() {
    let overlay = document.getElementById("foreverOverlay");
    if (overlay) overlay.remove();

    overlay = document.createElement("div");
    overlay.id = "foreverOverlay";
    overlay.className = "forever-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    document.body.appendChild(overlay);
    return overlay;
  }

  function closeOverlay() {
    document.getElementById("foreverOverlay")?.remove();
  }

  function showPurchaseConfirm() {
    const overlay = makeOverlay();
    overlay.innerHTML = `
      <section class="forever-card glass-card">
        <p class="eyebrow">The Heartglass awakens</p>
        <h2>Unlock the Forever Path?</h2>
        <p>You have gathered all ${COST} Heartglass Crystals.</p>
        <p>Spend them to permanently unlock the final secret path. Once unlocked, you may return whenever you wish and choose either Caelan or Caelia.</p>
        <div class="forever-actions">
          <button id="foreverCancel" class="btn" type="button">Not yet</button>
          <button id="foreverBuy" class="btn primary" type="button">Spend ${COST} ✦ and unlock it</button>
        </div>
      </section>
    `;

    overlay.querySelector("#foreverCancel").addEventListener("click", closeOverlay);
    overlay.querySelector("#foreverBuy").addEventListener("click", () => {
      if (forever.unlocked || forever.crystals < COST) return;
      forever.crystals -= COST;
      forever.unlocked = true;
      saveForever();
      renderWidget();
      showHeartChoice();
    });
  }

  function showHeartChoice() {
    const overlay = makeOverlay();
    const maleSeen = forever.viewed.male ? " <span class=\"forever-seen\">✓ Discovered</span>" : "";
    const femaleSeen = forever.viewed.female ? " <span class=\"forever-seen\">✓ Discovered</span>" : "";

    overlay.innerHTML = `
      <section class="forever-card glass-card forever-choice-card">
        <button id="foreverClose" class="icon-btn forever-close" type="button" aria-label="Close">×</button>
        <p class="eyebrow">The Forever Path</p>
        <h2>One final truth remains.</h2>
        <div class="forever-voice">
          <p>“Ten journeys have passed through the Heartglass.”</p>
          <p>“Ten times has a wandering heart crossed the veil, chosen, learned, lost, returned, and loved.”</p>
          <p>“Now tell me, little wanderer…”</p>
          <p>“To whom does your heart belong?”</p>
        </div>
        <div class="forever-actions vertical">
          <button id="chooseCaelan" class="btn primary" type="button">My heart belongs to Caelan.${maleSeen}</button>
          <button id="chooseCaelia" class="btn primary" type="button">My heart belongs to Caelia.${femaleSeen}</button>
        </div>
      </section>
    `;

    overlay.querySelector("#foreverClose").addEventListener("click", closeOverlay);
    overlay.querySelector("#chooseCaelan").addEventListener("click", () => showForeverEnding("male"));
    overlay.querySelector("#chooseCaelia").addEventListener("click", () => showForeverEnding("female"));
  }

  const endings = {
    male: {
      name: "Caelan",
      image: "assets/endings/male_forever.webp",
      alt: "Caelan seeing the player after the Heartglass has transformed them into fae.",
      paragraphs: [
        "The Heartglass does not open a doorway this time.",
        "It shines.",
        "Light pours through you without pain, warm as sunlight through leaves. The air changes first. You can hear the garden breathing, the old magic threaded through stone, the distant whisper of roots beneath the earth. When the radiance finally softens, your fingers rise uncertainly to the delicate new point of one ear.",
        "Caelan has forgotten how to speak.",
        "They stare at you with such naked wonder that, for a moment, the ancient Warden looks completely lost. Then a breathless laugh escapes them and they step close, lifting one hand to brush a strand of hair behind your newly fae ear.",
        "“Your ears,” they murmur, smiling helplessly. “Gods. They are so cute.”",
        "Their eyes travel over your face as though they are learning you all over again.",
        "“You were beautiful as a human. You know that, don't you?” Their thumb brushes your cheek. “But now…”",
        "Caelan's voice catches.",
        "“Now you're shining.”",
        "The Heartglass rests clear and quiet between you. It has sensed what neither distance nor mortality could undo: a love chosen freely, returned completely, and strong enough to ask for another shape.",
        "Caelan leans their forehead against yours, laughing softly even as their eyes grow bright.",
        "“I cannot believe I get forever with you now.”",
        "Their fingers lace through yours.",
        "“No more counting the years I might have with you. No more pretending I wasn't terrified of the day your lifetime ended while mine simply… continued.”",
        "They look at you, radiant with relief.",
        "“You chose this life. You chose me. And now I get to love you for as long as forever lasts.”"
      ]
    },
    female: {
      name: "Caelia",
      image: "assets/endings/female_forever.webp",
      alt: "Caelia seeing the player after the Heartglass has transformed them into fae.",
      paragraphs: [
        "The Heartglass does not open a doorway this time.",
        "It shines.",
        "Light pours through you without pain, warm as sunlight through leaves. The air changes first. You can hear the garden breathing, the old magic threaded through stone, the distant whisper of roots beneath the earth. When the radiance finally softens, your fingers rise uncertainly to the delicate new point of one ear.",
        "Caelia goes utterly still.",
        "Then their whole expression breaks into dazzled, disbelieving joy. They step toward you and, with exquisite gentleness, sweep a luminous strand of hair behind your newly fae ear.",
        "“Look at you,” they whisper, and a tiny laugh escapes them. “Your ears are so cute.”",
        "Their gaze lingers over every familiar feature made strange by the Heartglass glow.",
        "“You were beautiful as a human,” they say softly. “Truly, devastatingly beautiful.”",
        "Their fingertips trace your cheek.",
        "“But now…”",
        "Caelia exhales as though the sight of you has stolen the rest of the sentence.",
        "“Now you're radiant.”",
        "The Heartglass rests clear and quiet between you. It has sensed what neither distance nor mortality could undo: a love chosen freely, returned completely, and strong enough to ask for another shape.",
        "Caelia takes both your hands in theirs, eyes bright with a happiness too large to hide.",
        "“I cannot believe I get forever with you now.”",
        "They press their forehead to yours.",
        "“No more loving you with one part of my heart and fearing time with the other.”",
        "Their smile trembles into something tender and utterly certain.",
        "“You chose this life with me. And now I get to adore you for the rest of eternity.”"
      ]
    }
  };

  function showForeverEnding(route) {
    if (!forever.unlocked || !endings[route]) return;

    forever.viewed[route] = true;
    saveForever();

    const info = endings[route];
    const overlay = makeOverlay();
    const paragraphs = info.paragraphs.map(text => `<p>${escapeHtml(text)}</p>`).join("");

    overlay.innerHTML = `
      <section class="forever-ending-card glass-card">
        <p class="eyebrow">Ultimate Ending</p>
        <h2>Forever Across the Veil</h2>
        <p class="forever-with">${info.name} ✦ The Wanderer</p>
        <img class="forever-ending-art" src="${info.image}" alt="${escapeHtml(info.alt)}" draggable="false" />
        <div class="forever-ending-text">${paragraphs}</div>
        <div class="forever-actions">
          <button id="foreverOther" class="btn" type="button">Return to the Heartglass</button>
          <button id="foreverDone" class="btn primary" type="button">Return to Title</button>
        </div>
      </section>
    `;

    const img = overlay.querySelector(".forever-ending-art");
    img.addEventListener("error", () => {
      img.hidden = true;
    }, { once: true });

    overlay.querySelector("#foreverOther").addEventListener("click", showHeartChoice);
    overlay.querySelector("#foreverDone").addEventListener("click", closeOverlay);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function installStyles() {
    if (document.getElementById("heartglass-forever-style")) return;
    const style = document.createElement("style");
    style.id = "heartglass-forever-style";
    style.textContent = `
      .forever-path-box {
        margin-top: 1.15rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(232, 221, 173, 0.22);
        text-align: center;
      }
      .forever-crystal-line {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: .45rem;
        font-weight: 700;
        letter-spacing: .02em;
      }
      .forever-crystal-icon {
        font-size: 1.15rem;
        filter: drop-shadow(0 0 6px rgba(255, 238, 153, .55));
      }
      .forever-hint {
        margin: .45rem auto .8rem;
        max-width: 34rem;
        opacity: .78;
        font-size: .92rem;
      }
      .forever-path-btn {
        width: 100%;
      }
      .forever-path-btn:disabled {
        opacity: .48;
        cursor: not-allowed;
      }
      .forever-path-btn.unlocked {
        box-shadow: 0 0 20px rgba(238, 214, 123, .13);
      }
      .forever-overlay {
        position: fixed;
        inset: 0;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
        overflow-y: auto;
        background: rgba(4, 10, 8, .86);
        backdrop-filter: blur(8px);
      }
      .forever-card,
      .forever-ending-card {
        position: relative;
        width: min(760px, 100%);
        max-height: calc(100vh - 2rem);
        overflow-y: auto;
        padding: clamp(1.25rem, 4vw, 2.2rem);
      }
      .forever-ending-card {
        width: min(900px, 100%);
      }
      .forever-card h2,
      .forever-ending-card h2 {
        margin-top: .25rem;
      }
      .forever-close {
        position: absolute;
        top: .75rem;
        right: .75rem;
      }
      .forever-voice {
        margin: 1.2rem 0;
        padding: 1rem 1.1rem;
        border-left: 2px solid rgba(234, 214, 135, .45);
        font-style: italic;
      }
      .forever-actions {
        display: flex;
        gap: .7rem;
        margin-top: 1.25rem;
        flex-wrap: wrap;
      }
      .forever-actions.vertical {
        flex-direction: column;
      }
      .forever-actions .btn {
        flex: 1 1 12rem;
      }
      .forever-seen {
        margin-left: .35rem;
        font-size: .78em;
        opacity: .72;
        white-space: nowrap;
      }
      .forever-with {
        margin-top: -.35rem;
        opacity: .75;
      }
      .forever-ending-art {
        display: block;
        width: 100%;
        height: auto;
        margin: 1rem 0 1.4rem;
        border-radius: 14px;
        object-fit: cover;
      }
      .forever-ending-text p {
        line-height: 1.72;
        margin: 0 0 1rem;
      }
      @media (max-width: 640px) {
        .forever-actions {
          flex-direction: column;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function refreshFromStorage() {
    forever = loadForever();
    awardCrystalIfNeeded();
    renderWidget();
  }

  function start() {
    installStyles();
    renderWidget();
    awardCrystalIfNeeded();

    const app = document.getElementById("app") || document.body;
    const observer = new MutationObserver(() => {
      awardCrystalIfNeeded();
    });
    observer.observe(app, { childList: true, subtree: true, characterData: true });

    window.addEventListener("storage", event => {
      if (event.key === RUN_KEY || event.key === FOREVER_KEY) {
        refreshFromStorage();
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
