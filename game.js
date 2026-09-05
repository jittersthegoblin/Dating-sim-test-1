(() => {
  "use strict";

  const SAVE_KEY = "heartglass_run_v1";
  const META_KEY = "heartglass_meta_v1";
  const GAME_VERSION = 1;

  const LI = {
    male: {
      key: "male",
      name: "Caelan",
      subj: "he",
      obj: "him",
      poss: "his",
      reflexive: "himself",
      partner: "boyfriend",
      fiance: "fiancé",
      spouse: "husband"
    },
    female: {
      key: "female",
      name: "Caelia",
      subj: "she",
      obj: "her",
      poss: "her",
      reflexive: "herself",
      partner: "girlfriend",
      fiance: "fiancée",
      spouse: "wife"
    }
  };

  const endingInfo = {
    enemy: {
      icon: "💔",
      title: "Enemies",
      label: "Bad Ending",
      text: "Trust broke beyond repair. The veil opened, but the bond did not."
    },
    neutral: {
      icon: "🌙",
      title: "Two Passing Worlds",
      label: "Neutral Ending",
      text: "You returned home with respect between you, but little left unsaid."
    },
    friend: {
      icon: "🫶",
      title: "Across Any Distance",
      label: "Friend Ending",
      text: "The Heartglass remembered a friendship strong enough to cross worlds."
    },
    romance: {
      icon: "💕",
      title: "A Heart Between Worlds",
      label: "Romance Ending",
      text: "You chose one another, and began the difficult, wonderful work of making two worlds fit."
    },
    engaged: {
      icon: "💍",
      title: "A Promise Under Starlight",
      label: "Engaged Ending",
      text: "A fae promise became a proposal, and the future became something you would build together."
    },
    marriage: {
      icon: "✨",
      title: "Wherever You Are Is Home",
      label: "Secret / Best Ending",
      text: "The Heartglass revealed its oldest truth: love could join the worlds instead of choosing between them."
    }
  };

  function freshState() {
    return {
      version: GAME_VERSION,
      active: true,
      ended: false,
      route: null,
      scene: "antique_shop",
      stats: { trust: 0, bond: 0, affection: 0, respect: 0 },
      flags: {
        romanticIntent: false,
        boundaryRespected: true,
        boundaryViolated: false,
        heartglassLore: false,
        heartglassMarginalia: false,
        acceptedVulnerability: false,
        healthyConflict: false,
        honestAboutHome: false,
        beatChess: false,
        chessCheat: false,
        balconyKiss: false,
        balconyIntimacy: false,
        chooseBothWorlds: false,
        faeTruthLore: false,
        studyRelic: false,
        helpedResearch: false,
        trainingStyle: null,
        rodeIndependently: false,
        trustedHorse: false,
        earlyKissAttempt: false,
        lakeKissAttempt: false,
        dungeon: false,
        proposalAccepted: false,
        secretCandidate: false,
        majorCruelty: false
      },
      strikes: 0,
      committed: {},
      pending: null,
      history: [],
      startedAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  function loadMeta() {
    try {
      const parsed = JSON.parse(localStorage.getItem(META_KEY));
      return parsed && parsed.discovered ? parsed : { discovered: {} };
    } catch {
      return { discovered: {} };
    }
  }

  function saveMeta(meta) {
    localStorage.setItem(META_KEY, JSON.stringify(meta));
  }

  function loadState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!parsed || parsed.version !== GAME_VERSION) return null;
      return parsed;
    } catch {
      return null;
    }
  }

  let state = loadState();
  let meta = loadMeta();
  let endingReturnTarget = "title";

  const $ = (id) => document.getElementById(id);
  const titleScreen = $("titleScreen");
  const gameScreen = $("gameScreen");
  const endingsScreen = $("endingsScreen");
  const portraitPanel = $("portraitPanel");
  const portrait = $("portrait");
  const nameplate = $("nameplate");
  const chapterLabel = $("chapterLabel");
  const locationLabel = $("locationLabel");
  const speaker = $("speaker");
  const storyText = $("storyText");
  const choicesEl = $("choices");
  const continueStoryBtn = $("continueStoryBtn");
  const saveIndicator = $("saveIndicator");
  const heartglassText = $("heartglassText");

  function persist() {
    if (!state) return;
    state.updatedAt = Date.now();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    saveIndicator.textContent = "Saved";
    saveIndicator.classList.add("saved");
    window.setTimeout(() => {
      saveIndicator.textContent = "Autosave on";
      saveIndicator.classList.remove("saved");
    }, 800);
  }

  function totalBond(s = state) {
    if (!s) return 0;
    const x = s.stats;
    return x.trust + x.bond + x.affection + x.respect;
  }

  function heartglassMood() {
    if (!state || !state.route) return "Quiet";
    const t = totalBond();
    if (state.flags.dungeon || t <= -12) return "Cold";
    if (t < 25) return "Quiet";
    if (t < 58) return "Warm";
    if (t < 92) return "Glowing";
    return "Resonant";
  }

  function dateable() {
    return state && state.route ? LI[state.route] : null;
  }

  function cap(word) {
    return word ? word.charAt(0).toUpperCase() + word.slice(1) : word;
  }

  function T(input) {
    if (input == null) return "";
    let output = typeof input === "function" ? input(state) : String(input);
    const d = dateable();
    const values = d ? {
      name: d.name,
      subj: d.subj,
      Subj: cap(d.subj),
      obj: d.obj,
      Obj: cap(d.obj),
      poss: d.poss,
      Poss: cap(d.poss),
      reflexive: d.reflexive,
      partner: d.partner,
      fiance: d.fiance,
      spouse: d.spouse
    } : {};
    for (const [key, value] of Object.entries(values)) {
      output = output.replaceAll(`{${key}}`, value);
    }
    return output;
  }

  function p(...paras) {
    return paras.filter(Boolean).map(x => `<p>${T(x)}</p>`).join("");
  }

  function sprite(expression = "neutral", variant = null) {
    if (!state || !state.route) return null;
    const suffix = variant === "wedding" ? "wedding" : expression;
    return `assets/sprites/${state.route}_${suffix}.png`;
  }

  function effects(obj = {}) {
    if (!state) return;
    if (obj.stats) {
      for (const [key, amount] of Object.entries(obj.stats)) {
        state.stats[key] = (state.stats[key] || 0) + amount;
      }
    }
    if (obj.flags) Object.assign(state.flags, obj.flags);
    if (obj.strikes) state.strikes += obj.strikes;
  }

  function shouldDungeon() {
    if (!state || state.flags.dungeon) return false;
    const t = totalBond();
    return state.flags.majorCruelty || state.strikes >= 3 || state.stats.trust <= -11 || t <= -24;
  }

  function finalStanding() {
    const t = totalBond();
    const f = state.flags;
    const s = state.stats;

    if (f.dungeon || f.majorCruelty || state.strikes >= 3 || s.trust <= -11 || t <= -20) return "enemy";
    if (t < 32) return "neutral";
    if (!f.romanticIntent || s.affection < 17 || t < 66) return "friend";
    if (t < 98 || s.trust < 21 || s.bond < 22 || s.affection < 24 || s.respect < 15 || !f.balconyIntimacy) return "romance";
    return "proposal";
  }

  function qualifiesSecret() {
    const f = state.flags;
    const s = state.stats;
    const t = totalBond();
    return t >= 112 && s.trust >= 27 && s.bond >= 26 && s.affection >= 28 && s.respect >= 20 &&
      f.heartglassLore && f.heartglassMarginalia && f.acceptedVulnerability && f.healthyConflict &&
      f.honestAboutHome && f.beatChess && f.chooseBothWorlds && f.boundaryRespected && !f.boundaryViolated &&
      f.balconyIntimacy && !f.majorCruelty && state.strikes === 0;
  }

  function resolveFinalNode() {
    const result = finalStanding();
    if (result === "enemy") return "ending_enemy";
    if (result === "neutral") return "ending_neutral";
    if (result === "friend") return "ending_friend";
    if (result === "romance") return "ending_romance";
    return "proposal_scene";
  }

  function reaction(text, expression = "neutral", next = null, options = {}) {
    return { text: T(text), expression, next, ...options };
  }

  const scenes = {
    antique_shop: {
      chapter: "Prologue",
      location: "The Antique Shop",
      locationKey: "antique",
      portrait: false,
      speaker: "",
      body: () => p(
        "Rain pearls against the antique shop window in thin silver threads. You had only stepped inside to get out of the weather. The place smells of old paper, beeswax, dust, and something faintly green—as if a forest had once been folded into one of the cabinets and forgotten there.",
        "Near the back, half-hidden beneath a tray of tarnished keys, lies a pendant no larger than the center of your palm. Its frame is darkened silver. Inside it rests a cloudy piece of glass that seems to hold colors the room does not have.",
        "The handwritten price tag is blank. When you reach for it, the old shopkeeper is nowhere in sight."
      ),
      choices: [
        {
          id: "touch",
          text: "Pick up the strange pendant.",
          reaction: () => reaction(
            p("The instant your fingers close around it, the glass turns warm.", "Then it beats once against your palm—like a second heart."),
            "neutral",
            "winnowing"
          )
        },
        {
          id: "inspect",
          text: "Study it before touching it.",
          effects: { flags: { studyRelic: true } },
          reaction: () => reaction(
            p("You lean closer instead. Tiny marks ring the silver frame: leaves, stars, and two interlocking doorways. You are almost certain one of the marks moves when you blink.", "Curiosity wins. Your fingertips brush the glass."),
            "neutral",
            "winnowing"
          )
        }
      ]
    },

    winnowing: {
      chapter: "Prologue",
      location: "Between Worlds",
      locationKey: "void",
      portrait: false,
      body: () => p(
        "The shop vanishes without the courtesy of becoming blurry first.",
        "There is no floor. No ceiling. No rain. For one impossible instant you are falling through a place made entirely of cold stars and green-gold ribbons of light. Your stomach drops; your heart hammers; the pendant burns bright between your fingers.",
        '<span class="voice">“A wandering heart has crossed the veil.”</span>',
        '<span class="voice">“Before its path may open, the Heartglass must know where that heart may turn.”</span>',
        '<span class="voice">“Tell me, little wanderer. When love calls to you… whose voice do you wish to hear?”</span>'
      ),
      choices: [
        {
          id: "male",
          text: "My heart is drawn toward a man.",
          effects: { route: "male" },
          reaction: () => reaction(
            p('<span class="voice">“Then let the path answer.”</span>', "The Heartglass flashes blue-gold. The stars rush upward—or perhaps you fall downward—and the world returns all at once."),
            "neutral",
            "forest_waking",
            { setRoute: "male" }
          )
        },
        {
          id: "female",
          text: "My heart is drawn toward a woman.",
          effects: { route: "female" },
          reaction: () => reaction(
            p('<span class="voice">“Then let the path answer.”</span>', "The Heartglass blooms rose-gold. The stars rush upward—or perhaps you fall downward—and the world returns all at once."),
            "neutral",
            "forest_waking",
            { setRoute: "female" }
          )
        }
      ]
    },

    forest_waking: {
      chapter: "Chapter I",
      location: "The Fae Forest",
      locationKey: "forest",
      expression: "neutral",
      body: () => p(
        "Moss cushions your fall. Above you, trees taller than cathedral towers knit their branches across a violet sky. Pale lights drift between fern fronds. Somewhere nearby, water runs uphill over stones.",
        "A figure steps soundlessly from between two silver-barked trees. Long dark hair falls over an embroidered green coat. Pointed ears rise through the waves, and golden-green eyes fix first on you—then on the pendant still clenched in your hand.",
        "The stranger stops several paces away instead of approaching without permission.",
        '“You are either extraordinarily lost,” {subj} says, voice calm, “or the veil has developed a sense of humor.”'
      ),
      speaker: () => "Stranger",
      choices: [
        {
          id: "lost",
          text: "“I think ‘extraordinarily lost’ is the safer answer.”",
          effects: { stats: { trust: 2, bond: 2 } },
          reaction: () => reaction(p("A small smile threatens the corner of {poss} mouth.", '“Good. You still possess a sense of proportion.”'), "smile", "forest_relic")
        },
        {
          id: "who",
          text: "“Who are you? And where am I?”",
          effects: { stats: { respect: 2, trust: 1 } },
          reaction: () => reaction(p('{Subj} inclines {poss} head, apparently approving of the sensible questions.', '“Cael—” {subj} begins, then pauses. “{name}. Warden of this stretch of the veil. And you are very far from the world you know.”'), "neutral", "forest_relic")
        },
        {
          id: "backoff",
          text: "“Stay back. I don’t know what you are.”",
          effects: { stats: { trust: -2, bond: -1 }, strikes: 0 },
          reaction: () => reaction(p('{Name} lifts both hands slightly and does not take another step.', '“Reasonable. I would prefer caution to panic. I will remain here.”'), "neutral", "forest_relic")
        },
        {
          id: "insult",
          text: "“Whatever you are, keep those ears away from me.”",
          effects: { stats: { trust: -6, bond: -4, respect: -3 }, strikes: 1 },
          reaction: () => reaction(p("The warmth leaves {name}’s expression.", '“I see. Then we will keep this as brief as your manners permit.”'), "disappointed", "forest_relic")
        }
      ]
    },

    forest_relic: {
      chapter: "Chapter I",
      location: "The Fae Forest",
      locationKey: "forest",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        "{Name}’s attention returns to the pendant. This time the composure visibly cracks.",
        '“May I see what you are holding?”',
        "When you turn the object over in your palm, the cloudy glass pulses. {Name} goes very still.",
        '“Where,” {subj} asks carefully, “did you get a Heartglass?”'
      ),
      choices: [
        {
          id: "truth",
          text: "Tell the truth: “An antique shop. I picked it up and then… this happened.”",
          effects: { stats: { trust: 4, respect: 2 }, flags: { studyRelic: true } },
          reaction: () => reaction(p('{Name} stares at you. Then at the relic. Then back at you.', '“Your world sells lost interdimensional artifacts beside old teaspoons?”', "Despite the circumstances, there is something almost helplessly amused in {poss} disbelief."), "laugh", "forest_follow")
        },
        {
          id: "joke",
          text: "“I stole it from an ancient dragon. Obviously.”",
          effects: { stats: { bond: 2, affection: 1, trust: -1 }, flags: { romanticIntent: true } },
          reaction: () => reaction(p('{Name}’s eyes narrow.', '“Fae cannot knowingly lie, so I should warn you that I am at a terrible disadvantage in competitions of nonsense.”', "A pause. “Antique shop?”"), "smile", "forest_follow")
        },
        {
          id: "accuse",
          text: "“Maybe your world dragged me here on purpose.”",
          effects: { stats: { trust: -3, bond: -1 } },
          reaction: () => reaction(p('{Name} does not bristle. {Subj} only studies you for a moment.', '“Perhaps. But I did not. I will help you determine who—or what—did.”'), "sad", "forest_follow")
        }
      ]
    },

    forest_follow: {
      chapter: "Chapter I",
      location: "The Fae Forest",
      locationKey: "forest",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        '“The forest is safe enough if it knows you,” {name} says. “It does not know you.”',
        "A narrow path of pale mushrooms lights one by one behind {obj}, leading deeper between the trees.",
        '“My home is warded. You may stay there while we learn how the Heartglass brought you across. You are not a prisoner, and you will not owe me for the shelter.”',
        "{Subj} waits rather than assuming you will follow."
      ),
      choices: [
        {
          id: "accept",
          text: "“Thank you. I’d rather not test whether the forest likes strangers.”",
          effects: { stats: { trust: 3, bond: 2 } },
          reaction: () => reaction(p('“A wise first decision.”', "{Name} turns onto the glowing path, slowing {poss} pace enough that you can walk beside {obj} rather than behind."), "smile", "castle_arrival")
        },
        {
          id: "questions",
          text: "“I’ll come—but I’m going to have a lot of questions.”",
          effects: { stats: { respect: 3, bond: 1 } },
          reaction: () => reaction(p('“I would be concerned if you did not.”', "{Name} gestures for you to join {obj}. “Ask them one at a time. I am old, not omniscient.”"), "smile", "castle_arrival")
        },
        {
          id: "refuse",
          text: "“No. I don’t trust you.”",
          effects: { stats: { trust: -3, bond: -2 } },
          reaction: () => reaction(p('{Name} exhales slowly, but does not reach for you.', '“Then do not trust me yet. Trust the fact that I have offered you a choice.”', "After a long silence, {subj} points out the distant howl of something much too large. The castle suddenly seems like the less alarming gamble."), "disappointed", "castle_arrival")
        }
      ]
    },

    castle_arrival: {
      chapter: "Chapter II",
      location: "Vale Castle",
      locationKey: "castle",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        "Vale Castle does not rise above the forest so much as grow out of it. Pale stone towers twist between living trees, bridges arch through leaves, and warm windows glow beneath roofs green with moss.",
        "The household reacts to you with curiosity rather than alarm. A silver-haired steward murmurs to another servant, “The Warden brought them through the eastern gate,” and several pairs of eyes flick toward the Heartglass before politely looking away.",
        "Your room overlooks an inner courtyard. Fresh clothes have been laid out in several sizes. Food waits beside a pitcher of water.",
        '“I asked them not to guess what humans eat,” {name} says. “Our cook took that as a personal challenge.”'
      ),
      choices: [
        {
          id: "thanks",
          text: "“This is more kindness than I expected from a stranger. Thank you.”",
          effects: { stats: { trust: 3, bond: 4, affection: 1 } },
          reaction: () => reaction(p('{Name} looks briefly surprised, then pleased.', '“You are welcome. Being displaced between worlds is unpleasant enough without a bad mattress.”'), "smile", "castle_evening")
        },
        {
          id: "curious",
          text: "Ask how the castle’s wards work.",
          effects: { stats: { respect: 4, bond: 2 } },
          reaction: () => reaction(p("The question catches {name} immediately. {Poss} posture relaxes as {subj} explains how living roots, old stone, and spoken promises all overlap into the castle’s protection.", '“You truly do want to understand this place,” {subj} says, almost to {reflexive}.'), "smile", "castle_evening")
        },
        {
          id: "entitled",
          text: "“I hope this is the best room. You did kidnap me, after all.”",
          effects: { stats: { trust: -3, respect: -3, bond: -1 }, strikes: 1 },
          reaction: () => reaction(p('{Name}’s expression cools.', '“I did not bring you here. I am trying to undo what did.”', 'After a beat, {subj} adds, “But yes. It is one of the better rooms.”'), "disappointed", "castle_evening")
        }
      ]
    },

    castle_evening: {
      chapter: "Chapter II",
      location: "Vale Castle",
      locationKey: "castle",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        "Later, {name} returns with a small brass key for your door. {Subj} places it in your palm rather than keeping a copy visible at {poss} belt.",
        '“Lock it if that makes you more comfortable. No one enters a guest’s room here without invitation.”',
        "Before leaving, {poss} gaze drops briefly to the Heartglass hanging from the chain you found with it.",
        '“Tomorrow we begin in the library. If there is a way to open a stable path home, we will find it.”'
      ),
      choices: [
        {
          id: "promise",
          text: "“You really mean to help me get home, even if I’m inconvenient?”",
          effects: { stats: { trust: 3, bond: 2 } },
          reaction: () => reaction(p('{Name} looks at you as though the answer should be obvious.', '“Kindness that depends on convenience is merely good manners.”'), "smile", "library_search")
        },
        {
          id: "flirt",
          text: "“Careful. Keep treating me this well and I might start liking it here.”",
          effects: { stats: { affection: 4, bond: 2 }, flags: { romanticIntent: true } },
          reaction: () => reaction(p("For the first time, {name} is unmistakably caught off guard.", '“Then I will have to become much less hospitable.”', "The faint color at the tips of {poss} ears says {subj} does not mean it."), "blush", "library_search")
        },
        {
          id: "dismiss",
          text: "“Just find the portal. That’s all I need from you.”",
          effects: { stats: { bond: -3, affection: -1 } },
          reaction: () => reaction(p('“Understood.”', "{Name} gives you a courteous nod. It is the sort of courtesy that creates distance instead of closing it."), "sad", "library_search")
        }
      ]
    },

    library_search: {
      chapter: "Chapter III",
      location: "The Library",
      locationKey: "library",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        "The castle library occupies three floors around a hollow central shaft where books drift between balconies on threads of green light. {Name} has already built a fortress of reference volumes around one table.",
        '“Heartglass relics were once used by Wardens,” {subj} explains. “Most records say they found paths. Very few explain how.”',
        "One book is written in a script that rearranges itself when you look away. Another appears to dislike being opened and snaps its covers at your fingers.",
        '“That one is dramatic,” {name} says. “Ignore it.”'
      ),
      choices: [
        {
          id: "research",
          text: "Help seriously: compare the markings on the pendant to the diagrams.",
          effects: { stats: { respect: 5, trust: 3, bond: 2 }, flags: { helpedResearch: true, studyRelic: true } },
          reaction: () => reaction(p("You notice that the two interlocking doorway symbols repeat in the margins of a much older text. {Name} leans closer over your shoulder.", '“I missed that.”', 'When you glance at {obj}, {subj} looks pleased rather than threatened. “Do it again.”'), "smile", "library_marginalia")
        },
        {
          id: "ask_truth",
          text: "Ask about the comment that fae cannot lie.",
          effects: { stats: { bond: 3, trust: 2 }, flags: { faeTruthLore: true } },
          reaction: () => reaction(p('“We can evade. Omit. Phrase things with infuriating precision,” {name} admits. “But a direct falsehood catches in the throat.”', "{Subj} gives you a level look. “You appear far too delighted by this information.”"), "smile", "library_marginalia")
        },
        {
          id: "lazy",
          text: "Let {name} do the work while you wander around touching things.",
          effects: { stats: { respect: -3, bond: -1 } },
          reaction: () => reaction(p("After the third object you nearly activate, {name} silently moves the entire tray of magical artifacts out of your reach.", '“You may either help me or admire the shelves with your hands in your pockets.”'), "disappointed", "library_marginalia")
        },
        {
          id: "mock",
          text: "“For someone ancient, you don’t seem very good at this.”",
          effects: { stats: { respect: -5, trust: -3, bond: -2 }, strikes: 1 },
          reaction: () => reaction(p('{Name} closes the book in front of {obj}.', '“I am old enough to know the difference between teasing and contempt.”'), "angry", "library_marginalia")
        }
      ]
    },

    library_marginalia: {
      chapter: "Chapter III",
      location: "The Library",
      locationKey: "library",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        state.flags.helpedResearch || state.flags.studyRelic
          ? "Near sunset, you find a line written so faintly along the edge of a page that it only appears when the Heartglass is held above it."
          : "Near sunset, {name} finds a line written so faintly along the edge of a page that it only appears when the Heartglass is held above it.",
        '<span class="voice">“A door may return the wanderer. A heart may teach the door another shape.”</span>',
        '“Poetry,” {name} says, though {poss} gaze lingers on it. “Old Wardens were unfortunately fond of making practical instructions sound like prophecies.”',
        "Below the line is a half-erased symbol: two circles overlapping around a tiny star."
      ),
      choices: [
        {
          id: "copy",
          text: "Copy the strange line and symbol. It may matter later.",
          effects: { stats: { respect: 3 }, flags: { heartglassMarginalia: true, heartglassLore: true } },
          reaction: () => reaction(p("You copy it into the notebook {name} gave you. The Heartglass warms against your chest for the briefest instant.", "{Name} notices. So do you."), "neutral", "library_personal")
        },
        {
          id: "poetry",
          text: "“Maybe the poetry is the instruction.”",
          effects: { stats: { respect: 2, bond: 2 }, flags: { heartglassLore: true } },
          reaction: () => reaction(p('{Name} considers that longer than you expect.', '“A dangerous suggestion. It means I may have to reread several centuries of terrible verse.”'), "smile", "library_personal")
        },
        {
          id: "ignore",
          text: "Dismiss it as irrelevant old writing.",
          effects: { stats: { respect: -1 } },
          reaction: () => reaction(p('{Name} marks the page anyway. “One of us should remember it.”'), "neutral", "library_personal")
        }
      ]
    },

    library_personal: {
      chapter: "Chapter III",
      location: "The Library",
      locationKey: "library",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        "Hours of research soften the strangeness between you. At some point, the conversation drifts from relics to the person sitting across from you.",
        '“I became Warden because I was good at finding what did not belong where it had ended up,” {name} says. “Lost travelers. Broken crossings. Things that slipped through cracks.”',
        "{Subj} glances at you over the rim of a cup.",
        '“Apparently the profession has developed a sense of irony.”'
      ),
      choices: [
        {
          id: "care",
          text: "“You talk like everyone else is your responsibility. Who looks after you?”",
          effects: { stats: { bond: 5, trust: 4, affection: 2 } },
          reaction: () => reaction(p("The question stills {obj}. Not offended—simply unprepared.", '“I manage.”', "It is not an answer. If you learned the truth about fae, it is also not technically a lie."), "sad", "garden_walk")
        },
        {
          id: "admire",
          text: "“It suits you. You’re very good at making a disaster feel manageable.”",
          effects: { stats: { affection: 4, bond: 3, respect: 2 }, flags: { romanticIntent: true } },
          reaction: () => reaction(p('{Name} looks down at {poss} tea as though it has suddenly become academically fascinating.', '“That may be the nicest description anyone has ever given my occupation.”'), "blush", "garden_walk")
        },
        {
          id: "pry",
          text: "Press for every detail of {poss} past even when {subj} hesitates.",
          effects: { stats: { trust: -4, bond: -2 }, strikes: 1 },
          reaction: () => reaction(p('{Name} answers the first question. Evades the second. By the third, {poss} expression is closed.', '“Curiosity is not permission.”'), "disappointed", "garden_walk")
        }
      ]
    },

    garden_walk: {
      chapter: "Chapter IV",
      location: "The Moon Garden",
      locationKey: "garden",
      expression: "smile",
      speaker: () => "{name}",
      body: () => p(
        "The next afternoon, the books become unbearable. {Name} declares this with the solemnity of a medical diagnosis and takes you outside.",
        "The castle garden blooms in colors that seem impossible under daylight: silver roses, dark blue lilies with stars inside their petals, little bell-shaped flowers that turn to follow footsteps instead of the sun.",
        "{Name} stops beside a climbing vine and plucks one small white blossom. {Subj} hesitates before holding it toward you.",
        '“This one only opens near people it considers safe.”'
      ),
      choices: [
        {
          id: "accept",
          text: "Accept the flower and ask which bloom is {poss} favorite.",
          effects: { stats: { bond: 4, trust: 2, affection: 1 } },
          reaction: () => reaction(p("{Name} points toward an unimpressive patch of tiny green flowers tucked beneath a wall.", '“Those. They survive everything and ask for no attention while doing it.”', 'You grin. “That sounds suspiciously personal.” {Name} pretends not to hear you.'), "smile", "garden_closeness")
        },
        {
          id: "compliment",
          text: "“It’s beautiful. Though I think the person holding it is distracting me.”",
          effects: { stats: { affection: 5, bond: 2 }, flags: { romanticIntent: true } },
          reaction: () => reaction(p("The tips of {name}’s ears color before {subj} can stop them.", '“Humans are remarkably dangerous when unsupervised.”'), "blush", "garden_closeness")
        },
        {
          id: "mock_flower",
          text: "“So even the plants here are judging me?”",
          effects: { stats: { bond: 2 } },
          reaction: () => reaction(p('{Name} laughs. “Relentlessly. I recommend bribery.”'), "laugh", "garden_closeness")
        },
        {
          id: "crush",
          text: "Drop the flower and grind it under your heel just to see {poss} reaction.",
          effects: { stats: { trust: -8, bond: -7, respect: -5 }, strikes: 2, flags: { majorCruelty: true } },
          reaction: () => reaction(p("The white petals go still beneath your shoe.", "{Name} does not raise {poss} voice. The disappointment is much worse.", '“That was alive.”'), "angry", "dungeon_arrival")
        }
      ]
    },

    garden_closeness: {
      chapter: "Chapter IV",
      location: "The Moon Garden",
      locationKey: "garden",
      expression: "smile",
      speaker: () => "{name}",
      body: () => p(
        "A breeze shakes loose a pale petal. It catches in your hair. {Name} reaches toward you, then stops with {poss} hand halfway raised.",
        '“May I?”',
        "When you nod, {subj} carefully frees the petal. For a second, {poss} fingers are close to your temple and neither of you quite moves.",
        "The moment is quiet enough that you can hear the little garden bells turning toward you."
      ),
      choices: [
        {
          id: "stay",
          text: "Stay close and smile at {obj}.",
          effects: { stats: { affection: 4, trust: 2 }, flags: { romanticIntent: true } },
          reaction: () => reaction(p("{Name}’s eyes linger on yours for a heartbeat longer than necessary.", "Then {subj} steps back with a smile that is no longer entirely composed."), "blush", "training_choice")
        },
        {
          id: "early_kiss",
          text: "Try to kiss {obj}.",
          condition: () => totalBond() >= 10,
          effects: { flags: { earlyKissAttempt: true, romanticIntent: true }, stats: { affection: 2 } },
          reaction: () => reaction(p("You lean in. {Name} realizes what you mean to do and gently rests a hand against your shoulder before your mouths meet.", '“Ah.” For perhaps the first time, {subj} looks genuinely flustered. “Not yet.”', 'Then, softer: “That was not a never.”'), "blush", "garden_boundary")
        },
        {
          id: "tease",
          text: "“Were you staring at me, Warden?”",
          effects: { stats: { affection: 3, bond: 2 }, flags: { romanticIntent: true } },
          reaction: () => reaction(p('{Name} recovers with admirable speed. “I was assessing a botanical emergency.”', '“The petal?”', '“Extremely dangerous.”'), "smile", "training_choice")
        },
        {
          id: "step_back",
          text: "Step back and continue the walk.",
          effects: { stats: { trust: 1, respect: 1 } },
          reaction: () => reaction(p("{Name} gives you space immediately. Nothing in {poss} expression suggests offense.", "The conversation simply resumes, easy and unforced."), "neutral", "training_choice")
        }
      ]
    },

    garden_boundary: {
      chapter: "Chapter IV",
      location: "The Moon Garden",
      locationKey: "garden",
      expression: "blush",
      speaker: () => "{name}",
      body: () => p(
        "There is no anger in the refusal, only a clear boundary and the unmistakable warmth of someone who does not want you to mistake it for rejection.",
        '“We are all right,” {name} says. “What happens next depends somewhat on what you do with the word ‘not yet.’”'
      ),
      choices: [
        {
          id: "apologize",
          text: "“Sorry. I misread the moment.”",
          effects: { stats: { trust: 5, bond: 2 }, flags: { boundaryRespected: true } },
          reaction: () => reaction(p('{Name}’s shoulders loosen.', '“There is nothing to forgive. You asked a question without words. I answered it.”'), "smile", "training_choice")
        },
        {
          id: "accept",
          text: "“Not yet. Understood.”",
          effects: { stats: { trust: 4, respect: 2 }, flags: { boundaryRespected: true } },
          reaction: () => reaction(p('“Thank you.”', "A little later, {name} deliberately walks close enough that your shoulders brush. The choice is {poss} this time."), "smile", "training_choice")
        },
        {
          id: "push",
          text: "“Come on. You obviously wanted to.”",
          effects: { stats: { trust: -10, bond: -6, affection: -4, respect: -5 }, strikes: 2, flags: { boundaryRespected: false, boundaryViolated: true } },
          reaction: () => reaction(p("Every trace of blush disappears.", '“Wanting something eventually does not grant you permission now.”', "{Name} steps away. The walk back to the castle is very quiet."), "angry", "training_choice")
        }
      ]
    },

    training_choice: {
      chapter: "Chapter V",
      location: "The Training Grounds",
      locationKey: "training",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        "Two days later, research is interrupted by the sound of steel from the castle yard. {Name} is dressed more simply, sleeves rolled to the forearms, speaking with a pair of guards near the practice targets.",
        '“You have been staring at weapons since you arrived,” {subj} says when you approach. “Would you like to learn one, or should I continue pretending not to notice?”',
        "A rack holds polished bows beside blunted practice swords."
      ),
      choices: [
        {
          id: "archery",
          text: "Choose the bow.",
          effects: { flags: { trainingStyle: "archery" }, stats: { respect: 1 } },
          reaction: () => reaction(p('“Good choice.” {Name} selects a light recurve bow and tests the string. “It rewards patience, which means it may be good for both of us.”'), "smile", "training_session")
        },
        {
          id: "sword",
          text: "Choose the sword.",
          effects: { flags: { trainingStyle: "sword" }, stats: { respect: 1 } },
          reaction: () => reaction(p('“Ambitious.” {Name} tosses you a blunted blade hilt-first. “I approve.”'), "smile", "training_session")
        }
      ]
    },

    training_session: {
      chapter: "Chapter V",
      location: "The Training Grounds",
      locationKey: "training",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => state.flags.trainingStyle === "archery" ? p(
        "Your first arrow misses the target by an amount that feels personally insulting.",
        '“Your grip is fine,” {name} says. “Your shoulder is trying to climb into your ear.”',
        "{Subj} steps behind you, but stops before touching you.",
        '“May I adjust your stance?”'
      ) : p(
        "Your first exchange lasts three seconds before {name} taps the flat of {poss} practice blade against your shoulder.",
        '“You are watching the sword instead of me.”',
        "{Subj} circles closer, then pauses before placing a hand near your elbow.",
        '“May I?”'
      ),
      choices: [
        {
          id: "lean_close",
          text: "Let {obj} guide you and relax into the closeness.",
          effects: { stats: { trust: 3, affection: 4, bond: 2 }, flags: { romanticIntent: true } },
          reaction: () => reaction(p(state.flags.trainingStyle === "archery" ? "{Name}’s hand settles lightly against your arm, guiding your elbow down. The next arrow lands inside the outer ring." : "{Name} adjusts your elbow and stance, close enough that you can feel the warmth of {obj} at your back. Your next parry actually catches {poss} blade.", '“There,” {subj} murmurs. “Much better.”'), "blush", "training_challenge")
        },
        {
          id: "normal",
          text: "Accept the instruction normally.",
          effects: { stats: { trust: 3, respect: 3 } },
          reaction: () => reaction(p("The correction is practical and careful. {Name} withdraws as soon as you have the position.", '“Again.”'), "neutral", "training_challenge")
        },
        {
          id: "space",
          text: "Ask {obj} to demonstrate without touching you.",
          effects: { stats: { trust: 3, respect: 2 } },
          reaction: () => reaction(p('“Of course.”', "{Name} steps away immediately and demonstrates the movement from beside you instead. No disappointment. No teasing. Just another method."), "smile", "training_challenge")
        },
        {
          id: "crude",
          text: "Make a suggestive comment about {obj} finding an excuse to touch you.",
          effects: { stats: { affection: 1, respect: -3, trust: -2 } },
          reaction: () => reaction(p('{Name} gives you a dry look. “I assure you, if I wanted an excuse to flirt with you, I could think of one that involved fewer accidental arrows.”'), "disappointed", "training_challenge")
        }
      ]
    },

    training_challenge: {
      chapter: "Chapter V",
      location: "The Training Grounds",
      locationKey: "training",
      expression: "smile",
      speaker: () => "{name}",
      body: () => state.flags.trainingStyle === "archery" ? p(
        "By the end of the session, several arrows are actually where arrows are supposed to be. {Name} sets a final target farther downrange.",
        '“Last shot. No advice from me.”'
      ) : p(
        "By the end of the session, you are sweaty, grinning, and no longer losing every exchange immediately. {Name} raises {poss} practice sword one last time.",
        '“One clean touch. No favors.”'
      ),
      choices: [
        {
          id: "try",
          text: "Take the challenge seriously and do your best.",
          effects: { stats: { respect: 5, bond: 2 } },
          reaction: () => reaction(p(state.flags.trainingStyle === "archery" ? "The arrow lands close enough to center that {name}’s eyebrows rise." : "You feint badly, recover unexpectedly well, and tap the edge of {name}’s sleeve before {subj} can counter.", '“Good.” The approval in {poss} voice is immediate and genuine. “Very good.”'), "smile", "lake_evening")
        },
        {
          id: "helpless",
          text: "Pretend to be helpless so {subj} will keep helping you.",
          effects: { stats: { respect: -4, affection: -1, trust: -1 } },
          reaction: () => reaction(p("{Name} watches you deliberately make the same mistake three times.", '“You were doing that correctly five minutes ago.”', "The look {subj} gives you is more amused than angry, but not impressed."), "disappointed", "lake_evening")
        }
      ]
    },

    lake_evening: {
      chapter: "Chapter VI",
      location: "The Glasswater Lake",
      locationKey: "lake",
      expression: "smile",
      speaker: () => "{name}",
      body: () => p(
        "The lake lies beyond the castle gardens, smooth enough to reflect both moons. {Name} brings a basket of food and an apology for the cook’s latest attempt at ‘authentic human sandwiches.’",
        "You sit on the end of a narrow wooden dock with your shoes beside you. Tiny luminous fish gather beneath your feet whenever your toes disturb the water.",
        "For once there are no books between you. No guards. No problem to solve.",
        '“I had forgotten,” {name} says quietly, “that company can be restful.”'
      ),
      choices: [
        {
          id: "tease",
          text: "“Careful. That almost sounded like you enjoy having me around.”",
          effects: { stats: { affection: 4, bond: 3 }, flags: { romanticIntent: true } },
          reaction: () => reaction(p(state.flags.faeTruthLore ? '“An inconvenient question,” {name} says, because {subj} cannot simply lie.' : '“You are becoming extremely confident,” {name} says, which is not actually a denial.', "The smile gives {obj} away anyway."), "smile", "lake_vulnerability")
        },
        {
          id: "quiet",
          text: "“Me too.” Sit with the quiet together.",
          effects: { stats: { bond: 4, trust: 3 } },
          reaction: () => reaction(p("Nothing dramatic happens. That is what makes it intimate.", "You sit shoulder to shoulder beneath two moons while the fish turn slow circles below."), "smile", "lake_vulnerability")
        },
        {
          id: "kiss_lake",
          text: "Try to kiss {obj} here.",
          condition: () => state.flags.romanticIntent && state.stats.affection >= 11,
          effects: { stats: { affection: 2 }, flags: { lakeKissAttempt: true } },
          reaction: () => reaction(p("You turn toward {name}. {Poss} gaze drops to your mouth and, for one breath, {subj} does not move away.", "Then {subj} rests {poss} forehead lightly against yours instead.", '“You are impatient,” {subj} murmurs, unmistakably fond. “A little longer.”'), "blush", "lake_vulnerability")
        }
      ]
    },

    lake_vulnerability: {
      chapter: "Chapter VI",
      location: "The Glasswater Lake",
      locationKey: "lake",
      expression: "sad",
      speaker: () => "{name}",
      body: () => p(
        "The conversation eventually turns toward home—yours first, then {name}’s long life in the fae realm.",
        '“Mortals pass through here sometimes,” {subj} says. “Not like you. Usually only for a day, perhaps a week.”',
        "{Poss} fingers trace a line in the condensation on the bottle beside {obj}.",
        '“I have cared for humans before. Friends. People I admired. They grew old while I… did not. At some point I decided it was kinder to help mortals and not become attached to them.”',
        "{Subj} looks at you, rueful.",
        '“That decision was easier before you arrived.”'
      ),
      choices: [
        {
          id: "understand",
          text: "“I can’t promise forever. I can promise that what we have matters while we have it.”",
          effects: { stats: { trust: 6, bond: 6, affection: 4 }, flags: { acceptedVulnerability: true, romanticIntent: true } },
          reaction: () => reaction(p("{Name}’s expression softens with something almost painful.", '“That is a very mortal answer.”', '“Is that bad?”', '“No.” {Poss} hand turns palm-up between you. “I think it may be why I believe you.”'), "love", "meadow_ride")
        },
        {
          id: "forever",
          text: "“Then don’t worry. I’ll never leave you.”",
          effects: { stats: { affection: 3, trust: -1, respect: -2 } },
          reaction: () => reaction(p('{Name} smiles sadly. “You cannot know that.”', 'When you begin to protest, {subj} shakes {poss} head. “I would rather have an honest uncertainty than a beautiful promise neither of us can guarantee.”'), "sad", "meadow_ride")
        },
        {
          id: "dismiss_mortals",
          text: "“People die. You should be used to it by now.”",
          effects: { stats: { trust: -6, bond: -7, affection: -3 }, strikes: 1 },
          reaction: () => reaction(p("The words land hard.", '{Name} looks out over the lake. “Longevity does not make grief smaller. It only gives you more opportunities to learn that.”'), "sad", "meadow_ride")
        }
      ]
    },

    meadow_ride: {
      chapter: "Chapter VII",
      location: "The Sunmeadows",
      locationKey: "meadow",
      expression: "smile",
      speaker: () => "{name}",
      body: () => p(
        "A week after your arrival, {name} takes you beyond the castle walls to see where the Heartglass first entered Warden records. The path crosses broad meadows striped with blue grass and tiny white flowers.",
        "Two horses wait at the gate. One is tall and silver-gray. The other, a smaller chestnut mare, immediately noses your sleeve in search of contraband snacks.",
        '“That is Clover,” {name} says. “She has never respected authority.”',
        "Clover steals a piece of apple from {poss} hand to prove the point."
      ),
      choices: [
        {
          id: "own_horse",
          text: "Ride Clover yourself and learn as you go.",
          effects: { stats: { respect: 4, trust: 2, bond: 2 }, flags: { rodeIndependently: true, trustedHorse: true } },
          reaction: () => reaction(p("{Name} checks your stirrups, asks whether you want advice, and then lets you handle the rest.", "By the time you reach the open meadow, Clover has decided you are acceptable. {Name} looks more impressed than worried."), "smile", "meadow_pause")
        },
        {
          id: "together",
          text: "Admit you’re nervous and ask whether you can ride with {obj}.",
          effects: { stats: { trust: 4, bond: 3, affection: 3 }, flags: { trustedHorse: true, romanticIntent: true } },
          reaction: () => reaction(p('“Of course.”', "{Name} does not tease you. {Subj} helps you up first, asks where you are comfortable holding on, and keeps the horse to an easy pace until your grip stops being quite so determined."), "smile", "meadow_pause")
        },
        {
          id: "walk",
          text: "“Horses make me nervous. Can we walk instead?”",
          effects: { stats: { trust: 4, respect: 2, bond: 2 } },
          reaction: () => reaction(p('“Then we walk.”', '“But won’t it take longer?”', '“There is no prize for frightening yourself.”', "{Name} hands the reins to a stablehand without another word."), "smile", "meadow_pause")
        },
        {
          id: "rough",
          text: "Yank hard on Clover’s reins when she resists you.",
          effects: { stats: { trust: -7, bond: -5, respect: -6 }, strikes: 2 },
          reaction: () => reaction(p("{Name} catches the reins before you can do it again.", '“No.” The word is quiet and absolute. “Fear is not disobedience.”', "{Subj} takes Clover from you and the ride ends there."), "angry", "conflict_corridor")
        }
      ]
    },

    meadow_pause: {
      chapter: "Chapter VII",
      location: "The Sunmeadows",
      locationKey: "meadow",
      expression: "smile",
      speaker: () => "{name}",
      body: () => p(
        "At the highest hill, the whole fae valley opens beneath you: forests like green oceans, distant white towers, rivers shining like thread. Far beyond them, a vertical shimmer hangs in the sky where the veil is thinnest.",
        '“That is where your portal will form when the cycle turns,” {name} says.',
        "The statement should feel like relief. It does. It also does something more complicated.",
        "{Name} seems to feel the same complication, because {subj} looks away first."
      ),
      choices: [
        {
          id: "miss_home",
          text: "Talk about something you genuinely miss from home.",
          effects: { stats: { trust: 4, bond: 4 } },
          reaction: () => reaction(p("{Name} listens without trying to make the fae realm compete with your old life.", '“You are allowed to miss it,” {subj} says. “I would be worried if you did not.”'), "smile", "conflict_corridor")
        },
        {
          id: "miss_them",
          text: "“I wanted the portal so badly at first. Now I’m starting to hate the thought of leaving you.”",
          effects: { stats: { affection: 5, trust: 3, bond: 3 }, flags: { romanticIntent: true } },
          reaction: () => reaction(p("{Name} closes {poss} eyes for a brief second.", '“You do have a talent for saying dangerous things in beautiful places.”'), "blush", "conflict_corridor")
        },
        {
          id: "cant_wait",
          text: "“Good. I can’t wait to be done with this place.”",
          effects: { stats: { bond: -4, affection: -3 } },
          reaction: () => reaction(p('“I know you want to go home.” {Name}’s voice remains gentle. “You need not make this world ugly in order to justify leaving it.”'), "sad", "conflict_corridor")
        }
      ]
    },

    conflict_corridor: {
      chapter: "Chapter VIII",
      location: "Vale Castle",
      locationKey: "castle",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        "That evening, every ward in the castle flares gold at once. Somewhere beyond the windows, the veil shudders like fabric caught in a storm.",
        "{Name} finds you in the corridor already fastening {poss} cloak.",
        '“A crossing has torn open near the eastern ridge. I need to close it.”',
        "{Subj} glances toward your room.",
        '“The castle is the safest place for you while the wards are unstable. I am asking you to stay inside until I return.”'
      ),
      choices: [
        {
          id: "healthy",
          text: "“I’ll stay. But tell me what’s happening instead of deciding I can’t handle knowing.”",
          effects: { stats: { trust: 5, respect: 5, bond: 3 }, flags: { healthyConflict: true } },
          reaction: () => reaction(p("{Name} pauses, then nods immediately.", '“Fair.” {Subj} explains the danger, what the wards will do, and exactly how long {subj} expects to be gone.', 'Before leaving, {subj} adds, “Thank you for making me explain instead of simply obey.”'), "smile", "drawing_chess")
        },
        {
          id: "obey",
          text: "“All right. Be careful.”",
          effects: { stats: { trust: 3, bond: 2 } },
          reaction: () => reaction(p('{Name}’s expression softens. “I will.”', "{Subj} leaves only after making sure you know where the household will shelter if the wards fail."), "smile", "drawing_chess")
        },
        {
          id: "storm_off",
          text: "“You don’t own me.” Push past {obj} and head for the gate.",
          effects: { stats: { trust: -8, respect: -5, bond: -4 }, strikes: 2 },
          reaction: () => reaction(p("{Name} does not grab you. {Subj} steps into your path instead.", '“No. I do not own you. And if you choose to leave once I have explained the risk, I will not imprison you.”', 'The anger in {poss} eyes is fear sharpened by frustration. “But do not mistake being loved enough to worry for being controlled.”'), "angry", "drawing_chess")
        },
        {
          id: "cling",
          text: "“Then I’m coming with you. I don’t care if it makes your job harder.”",
          effects: { stats: { affection: 1, trust: -3, respect: -3 } },
          reaction: () => reaction(p('{Name}’s mouth tightens. “Wanting to be near me is not the same as helping me.”', '“Please stay where I know you are safe.”'), "disappointed", "drawing_chess")
        }
      ]
    },

    drawing_chess: {
      chapter: "Chapter IX",
      location: "The Drawing Room",
      locationKey: "drawing",
      expression: "smile",
      speaker: () => "{name}",
      body: () => p(
        "The veil storm passes. The following night, rain taps at the drawing-room windows while a fire burns low beneath the mantel. {Name} produces a carved chess set with suspicious confidence.",
        '“You know this game?”',
        '“Yes.”',
        '“Excellent.” {Poss} smile turns dangerous. “I dislike teaching people immediately before defeating them.”',
        "Two games later, you have learned that {name} becomes very quiet when concentrating—and very smug when winning."
      ),
      choices: [
        {
          id: "beat",
          text: "Take the opening {subj} left you and win honestly.",
          effects: { stats: { respect: 7, affection: 3, bond: 2 }, flags: { beatChess: true } },
          reaction: () => reaction(p("You move your queen. {Name} reaches for a piece, stops, and studies the board.", '“No.”', 'You wait.', '“No, that is…” {Subj} leans closer. Then slowly smiles. “You knew exactly what you were doing.”', '“Checkmate.”', '“Troublesome,” {subj} says, looking far more interested than annoyed.'), "love", "tower_stars")
        },
        {
          id: "lose_fair",
          text: "Play honestly and lose after a good fight.",
          effects: { stats: { respect: 4, bond: 3 } },
          reaction: () => reaction(p('{Name} finally corners your king after a long match. “That was unpleasantly close.”', '“You’re welcome.”', '{Subj} laughs. “Again tomorrow.”'), "laugh", "tower_stars")
        },
        {
          id: "throw",
          text: "Deliberately let {obj} win.",
          effects: { stats: { respect: -4, trust: -1 } },
          reaction: () => reaction(p("{Name} stares at the move you make. Then at you.", '“Did you just let me win?”', 'You attempt innocence.', '“Please do not do that again. If I lose, I would like the dignity of earning it.”'), "disappointed", "tower_stars")
        },
        {
          id: "cheat",
          text: "Distract {obj} with flirting and quietly move one of {poss} pieces.",
          effects: { stats: { affection: 4, bond: 2, trust: -2, respect: -1 }, flags: { romanticIntent: true, chessCheat: true } },
          reaction: () => reaction(p('“Your eyes are very pretty when you’re plotting,” you say.', "{Name}’s gaze flicks up. You steal a rook.", 'Three moves later, {subj} takes your queen and the stolen rook from your sleeve. “Your technique lacks subtlety.”', '“Did the flirting work?”', 'A pause. “Annoyingly.”'), "blush", "tower_stars")
        }
      ]
    },

    tower_stars: {
      chapter: "Chapter X",
      location: "The Tower Balcony",
      locationKey: "tower",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        "After chess, neither of you is ready to sleep. {Name} leads you up a narrow spiral stair until the castle falls away beneath a round balcony at the top of the western tower.",
        "The sky is impossibly clear. Two moons hang low over the forest, and unfamiliar constellations burn in great sweeping arcs. {Name} drapes a blanket over the stone bench between you without comment.",
        "For a long time, you simply look up.",
        '“The portal cycle begins tomorrow night,” {name} finally says.',
        "The quiet changes shape.",
        '“When the way home opens… will you be happy to leave?”'
      ),
      choices: [
        {
          id: "honest",
          text: "“I miss home. But that doesn’t mean I won’t miss you.”",
          effects: { stats: { trust: 6, bond: 5, affection: 4, respect: 2 }, flags: { honestAboutHome: true } },
          reaction: () => reaction(p("{Name}’s eyes close for half a heartbeat, as if the honesty hurts and comforts in equal measure.", '“Thank you.”', '“For what?”', '“For not pretending loving something here requires hating what you left behind.”'), "love", "tower_intimacy")
        },
        {
          id: "stay_forever",
          text: "“I don’t care about anything back home anymore. I’d stay here forever for you.”",
          effects: { stats: { affection: 5, bond: 1, trust: -1, respect: -3 }, flags: { romanticIntent: true } },
          reaction: () => reaction(p('{Name} looks moved—and troubled.', '“Do not make yourself smaller to fit beside me.”', '“I want to be chosen. I do not want to be the reason you abandon every other piece of your life.”'), "sad", "tower_intimacy")
        },
        {
          id: "leave",
          text: "“Yes. I can’t wait to leave.”",
          effects: { stats: { affection: -5, bond: -5, trust: -2 } },
          reaction: () => reaction(p("{Name} nods once. The hurt is small, controlled, and impossible to miss.", '“Then I hope tomorrow brings you exactly what you want.”'), "sad", "tower_intimacy")
        },
        {
          id: "life",
          text: "“I want you in my life, even if I go home.”",
          effects: { stats: { bond: 6, trust: 4, affection: 3 }, flags: { honestAboutHome: true } },
          reaction: () => reaction(p('{Name} turns fully toward you. “That is the question I have been afraid to ask.”', "The distance between you suddenly feels very small."), "love", "tower_intimacy")
        }
      ]
    },

    tower_intimacy: {
      chapter: "Chapter X",
      location: "The Tower Balcony",
      locationKey: "tower",
      expression: () => state.flags.romanticIntent || state.stats.affection >= 16 ? "blush" : "smile",
      speaker: () => "{name}",
      body: () => p(
        "A shooting star crosses the unfamiliar sky. Then another.",
        "{Name} looks at you instead of either one.",
        state.flags.earlyKissAttempt
          ? '“You have been unusually patient since the garden,” {subj} says, a faint smile at {poss} mouth.'
          : '“I find myself wishing we had been given more time,” {subj} admits.',
        "The moment does not feel accidental. Whatever you do next will be understood."
      ),
      choices: [
        {
          id: "kiss",
          text: "Kiss {obj}.",
          condition: () => (state.flags.romanticIntent || state.stats.affection >= 17) && state.stats.trust >= 7,
          effects: { stats: { affection: 8, trust: 4, bond: 4 }, flags: { romanticIntent: true, balconyKiss: true, balconyIntimacy: true } },
          reaction: () => reaction(p("You lean closer slowly enough for {name} to understand. {Poss} gaze drops to your mouth. {Subj} has every opportunity to move away.", "{Subj} does not.", "Instead, {subj} closes the last inch {reflexive}. The kiss is warm and careful at first, then softened by the quiet laugh that escapes when you both realize how long you have been circling it.", state.flags.earlyKissAttempt ? 'When you part, you whisper, “So… now?” {Name}’s cheeks warm. “Yes. Now.”' : 'When you part, {name} rests {poss} forehead against yours. “I have wanted to do that for an embarrassing amount of time.”'), "love", "portal_reveal")
        },
        {
          id: "hand_romance",
          text: "Take {poss} hand. “I don’t want this to end just because the portal opens.”",
          effects: { stats: { affection: 6, trust: 5, bond: 5 }, flags: { romanticIntent: true, balconyIntimacy: true } },
          reaction: () => reaction(p("{Name} turns {poss} hand beneath yours and threads your fingers together.", '“Then we do not call the portal an ending.”', "{Subj} lifts your joined hands and presses a quiet kiss to your knuckles."), "love", "portal_reveal")
        },
        {
          id: "friend_hand",
          text: "Take {poss} hand without turning the moment romantic.",
          effects: { stats: { bond: 5, trust: 4 } },
          reaction: () => reaction(p("{Name} squeezes your hand. No expectation follows it.", '“Whatever tomorrow is,” {subj} says, “I am glad you fell into my forest.”'), "smile", "portal_reveal")
        },
        {
          id: "distance",
          text: "Keep a little distance and watch the stars.",
          effects: { stats: { respect: 1 } },
          reaction: () => reaction(p("{Name} accepts the quiet without trying to turn it into something else.", "You watch the sky until the cold finally drives you back inside."), "neutral", "portal_reveal")
        }
      ]
    },

    portal_reveal: {
      chapter: "Final Chapter",
      location: "The Veil Chamber",
      locationKey: "portal",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        "The next evening, the Heartglass wakes before sunset.",
        "{Name} leads you beneath the castle into a circular chamber open to the sky. The same symbols from the pendant are carved into the floor. At the center, light gathers vertically until it becomes a doorway filled with rain.",
        "Your rain. The antique shop window is visible on the other side.",
        "You could step through and be home in seconds.",
        '“The path is stable,” {name} says. {Subj} sounds relieved. {Subj} also sounds like someone carefully holding a cracked thing together. “You can go whenever you are ready.”'
      ),
      choices: [
        {
          id: "both",
          text: "“I want home. I also want you. There has to be a way to keep both.”",
          effects: { stats: { trust: 5, bond: 6, affection: 5, respect: 3 }, flags: { chooseBothWorlds: true, romanticIntent: true } },
          reaction: () => reaction(p("The Heartglass flashes so brightly that both of you look down.", "For an instant, the two-circle symbol from the library appears inside the glass.", '{Name} sees it too. “That,” {subj} whispers, “was not in any of the records I trusted.”'), "love", "final_words")
        },
        {
          id: "stay",
          text: "“I want to stay here with you.”",
          effects: { stats: { affection: 6, bond: 3, trust: 2 }, flags: { romanticIntent: true } },
          reaction: () => reaction(p('{Name}’s eyes soften. “If that is what you choose, I will be happy.”', 'Then {subj} adds, “But not tonight. Go home first. See it again. Choose me after you remember what you are choosing between.”'), "love", "final_words")
        },
        {
          id: "home",
          text: "“I need to go home.”",
          effects: { stats: { trust: 3, respect: 3 } },
          reaction: () => reaction(p('“I know.”', "{Name} smiles, and whatever sadness is there does not become a burden {subj} asks you to carry."), "smile", "final_words")
        },
        {
          id: "used",
          text: "“You did your job. I don’t need you anymore.”",
          effects: { stats: { trust: -10, bond: -10, affection: -8, respect: -6 }, strikes: 2 },
          reaction: () => reaction(p("{Name} becomes very still.", '“Then I am glad I succeeded at the part that mattered.”', "{Subj} steps away from the portal, leaving the path clear."), "sad", "final_words")
        }
      ]
    },

    final_words: {
      chapter: "Final Chapter",
      location: "The Veil Chamber",
      locationKey: "portal",
      expression: () => finalStanding() === "proposal" ? "love" : finalStanding() === "romance" ? "love" : finalStanding() === "friend" ? "smile" : "neutral",
      speaker: () => "{name}",
      body: () => p(
        "The portal hums behind you. The choice of what happens after this moment feels larger than the doorway itself.",
        finalStanding() === "proposal" || finalStanding() === "romance"
          ? '“Before you go,” {name} says, “there is something I refuse to leave to implication.”'
          : finalStanding() === "friend"
            ? '“Before you go,” {name} says, “promise me one thing.”'
            : '“The veil will remain open for several minutes,” {name} says.'
      ),
      choices: [
        {
          id: "finish",
          text: () => finalStanding() === "proposal" || finalStanding() === "romance" ? "Hear what {subj} has to say." : finalStanding() === "friend" ? "Listen." : "Step toward the portal.",
          reaction: () => reaction(
            finalStanding() === "proposal"
              ? p('{Name} takes your hand. “I love you.”', 'There is no clever fae phrasing, no graceful evasion. Just the truth.', '“And I would like to discuss something more permanent than goodbye.”')
              : finalStanding() === "romance"
                ? p('{Name} takes your hand. “I love you.”', 'There is no clever fae phrasing, no graceful evasion. Just the truth.', '“I do not know exactly what two worlds will require of us. I would like to find out as your {partner}, if you want the same.”')
                : finalStanding() === "friend"
                  ? p('“Do not let distance turn this into a story you tell once and then put away,” {name} says.', '“You are my friend. That is not a lesser thing because it is not romance.”')
                  : finalStanding() === "neutral"
                    ? p('{Name} offers you a small, respectful smile. “I hope your world is kinder to you for having left it briefly.”')
                    : p('{Name} gestures toward the portal. “Go home.”'),
            finalStanding() === "enemy" ? "disappointed" : finalStanding() === "neutral" ? "neutral" : finalStanding() === "friend" ? "smile" : "love",
            resolveFinalNode()
          )
        }
      ]
    },

    proposal_scene: {
      chapter: "Epilogue",
      location: "The Veil Chamber",
      locationKey: "portal",
      expression: "love",
      speaker: () => "{name}",
      body: () => p(
        "Instead of letting go of your hand, {name} reaches into the inner fold of {poss} coat and removes a narrow ring of pale gold. It is shaped like two fine branches meeting around a green stone.",
        '“Among my people, a promise like this is not ownership. It is an invitation renewed every day.”',
        "{Subj} exhales, suddenly less like an ancient Warden and more like someone very aware that you can say no.",
        '“I know this is fast by fae standards and absurd by several human ones. But I also know I do not want a future in which losing sight of this portal means losing you.”',
        '“Will you let me call you my future, and be my {fiance}?”'
      ),
      choices: [
        {
          id: "accept",
          text: "Accept the proposal.",
          effects: { stats: { affection: 5, trust: 4, bond: 4 }, flags: { proposalAccepted: true } },
          reaction: () => {
            state.flags.secretCandidate = qualifiesSecret();
            return reaction(
              p("For one stunned heartbeat, {name} simply looks at you.", "Then {subj} laughs—a breathless, disbelieving sound—and slides the ring onto your finger before pulling you into an embrace.", state.flags.secretCandidate ? "The Heartglass erupts with light before either of you can say another word." : '“You have made a very old fae embarrassingly happy,” {subj} murmurs.'),
              "laugh",
              state.flags.secretCandidate ? "secret_reveal" : "ending_engaged"
            );
          }
        },
        {
          id: "not_yet",
          text: "“I love you, but I’m not ready to be engaged yet.”",
          effects: { stats: { trust: 4, respect: 4 } },
          reaction: () => reaction(p("{Name} closes {poss} fingers around the ring and smiles.", '“Then not yet.”', 'No disappointment becomes punishment. No affection is withdrawn. “I would rather receive an honest no than a frightened yes.”'), "smile", "ending_romance")
        }
      ]
    },

    secret_reveal: {
      chapter: "???",
      location: "The Heartglass",
      locationKey: "portal",
      expression: "love",
      speaker: () => "The Heartglass",
      body: () => p(
        "The portal does not collapse. It divides.",
        "The rain-soaked antique shop remains on one side of the chamber. On the other, a second doorway opens onto the moon garden. Between them appears the symbol you copied in the library: two circles overlapping around a star.",
        '<span class="voice">“A door may return the wanderer.”</span>',
        '<span class="voice">“A heart may teach the door another shape.”</span>',
        "{Name} stares at the Heartglass with the expression of a scholar discovering that several centuries of accepted history were missing the final page.",
        '<span class="voice">“Two homes. One chosen bond. The oldest covenant may be renewed.”</span>',
        '“It was never meant to make you choose a world,” {name} breathes. “It was made to join them.”'
      ),
      choices: [
        {
          id: "take_hand",
          text: "Take {name}’s hand and choose the hidden path together.",
          effects: { stats: { trust: 3, bond: 3, affection: 3 } },
          reaction: () => reaction(p("The Heartglass turns clear for the first time.", "The joined doorway settles into something permanent. There will be no need to rush the rest. For the first time, you have all the time you need to choose the day together."), "love", "ending_marriage")
        },
        {
          id: "wait",
          text: "“I want this. But I want the wedding when we choose the day—not because magic chose it for us.”",
          effects: { stats: { respect: 5, trust: 5 } },
          reaction: () => reaction(p("{Name}’s smile becomes impossibly soft.", '“There you are.”', '{Subj} kisses your forehead. “Then we keep the secret, keep the door, and choose our own day.”'), "love", "ending_engaged")
        }
      ]
    },

    dungeon_arrival: {
      chapter: "Broken Path",
      location: "The Castle Dungeon",
      locationKey: "dungeon",
      expression: "disappointed",
      speaker: () => "{name}",
      onEnter: () => { state.flags.dungeon = true; },
      body: () => p(
        "The relationship does not break in one dramatic explosion. It breaks when {name} finally decides that kindness no longer makes being alone with you safe.",
        "The old castle dungeon is not a torture chamber. Your room has a bed, blankets, clean water, a washbasin, and a barred window looking onto the lower garden. Books appear after you ask for something to read.",
        "{Name} stands outside the open door while two guards wait farther down the corridor.",
        '“I will not hurt you,” {subj} says. {Poss} voice is tired, not cruel. “But I no longer trust you with free access to my home.”',
        '“The veil opens tomorrow night. Until then, you will remain here.”'
      ),
      choices: [
        {
          id: "apology",
          text: "Apologize without asking {obj} to forgive you.",
          effects: { stats: { trust: 2, respect: 2 } },
          reaction: () => reaction(p("{Name} listens. {Subj} does not tell you everything is fine.", '“I appreciate the apology.”', 'After a pause: “It does not repair this. But I appreciate it.”'), "sad", "dungeon_wait")
        },
        {
          id: "rage",
          text: "Blame {obj} and demand to be released.",
          effects: { stats: { trust: -5, respect: -4 }, strikes: 1 },
          reaction: () => reaction(p('{Name} lets you finish.', '“The answer remains no.”', "The door closes gently, which somehow makes the finality worse."), "angry", "dungeon_wait")
        },
        {
          id: "silence",
          text: "Say nothing.",
          reaction: () => reaction(p("{Name} nods once and leaves you with your silence."), "sad", "dungeon_wait")
        }
      ]
    },

    dungeon_wait: {
      chapter: "Broken Path",
      location: "The Castle Dungeon",
      locationKey: "dungeon",
      expression: "neutral",
      speaker: () => "{name}",
      body: () => p(
        "The following night, {name} returns personally. {Subj} could have sent a guard. {Subj} does not.",
        "The Heartglass glows in {poss} hand. Behind {obj}, the corridor opens onto the veil chamber and the waiting portal.",
        '“Your way home is ready.”',
        "There is no invitation to stay."
      ),
      choices: [
        {
          id: "go",
          text: "Go home.",
          reaction: () => reaction(p("You pass {name} in the corridor. {Subj} steps aside to give you room.", "The portal closes behind you."), "disappointed", "ending_enemy")
        }
      ]
    },

    ending_enemy: endingNode("enemy", "The antique shop returns around you exactly as you left it. Rain still marks the glass. Perhaps only minutes passed here. Perhaps the fae realm simply does not care how human clocks work.\n\nThe Heartglass is dull in your palm. When you touch it again, it remains cold. Somewhere beyond the veil, a Warden you might once have known has closed the door."),
    ending_neutral: endingNode("neutral", "You step through the portal. {Name} remains on the other side until the last possible second, making sure the crossing is stable.\n\nThere is respect in the goodbye. Gratitude, perhaps. But neither of you reaches for the other. The Heartglass dims once you are home, becoming an extraordinary artifact attached to a memory of an extraordinary person you did not quite come to know."),
    ending_friend: endingNode("friend", "You return home with tears in your eyes and {name}’s promise in your pocket: a small leaf of gold that warms whenever the veil is thin.\n\nThree weeks later, the Heartglass glows on your bedside table. A narrow doorway opens into the moon garden, and {name} is waiting on the other side with two cups of tea and an expression of unbearable satisfaction.\n\n“See?” {subj} says. “Distance is a logistical problem. Friendship is not.”"),
    ending_romance: endingNode("romance", "The first months are untidy in the best way. Sometimes the Heartglass opens for an hour. Sometimes for a whole weekend. You learn how to keep clothes in two worlds and how to explain human takeaway menus to an ancient fae Warden.\n\n{name} learns your world too: traffic lights, grocery stores, terrible television, and the fact that no amount of magic makes flat-pack furniture less irritating.\n\nOne evening, crossing back into the fae realm, you find {obj} waiting where the forest path begins. “There you are,” {subj} says, and kisses you like arriving is already becoming a kind of home."),
    ending_engaged: endingNode("engaged", "The ring is not an ending. It is a beginning you chose deliberately.\n\nYou return home, then come back. You meet each other’s worlds properly. You argue about schedules, laugh about customs, learn what compromise looks like when one partner can open a magical doorway and the other has appointments on Tuesday.\n\nWhenever someone asks where the wedding will be, {name} looks at you and says, “Whichever world has better cake.”\n\nThe Heartglass glows warmly between your homes, keeping its oldest secret a little longer."),
    ending_marriage: endingNode("marriage", "Months later, on a day chosen by both of you rather than by prophecy, the old rite begins beneath two moons. The Heartglass opens both worlds at once: your sky visible through one arch, the fae stars through another. Neither is abandoned. Neither is lesser.\n\n{name} waits in ivory, green, and gold, no Warden’s composure left to hide behind. {Subj} holds out {poss} hand to you.\n\n“Come here,” {subj} says, smiling. “I have crossed quite enough distance for one lifetime.”\n\nYou take {poss} hand.\n\nThe vows are simple. Choose freely. Speak truly. Return willingly. Love without ownership. Grow without asking the other to become smaller.\n\nWhen the Heartglass seals the covenant, the two doorways remain. Not portals borrowed from a relic, but permanent paths between the places that made you.\n\nLater, when someone asks which world is home, you look at your {spouse}.\n\nThe answer has become wonderfully obvious.", true)
  };

  function endingNode(id, text, wedding = false) {
    return {
      chapter: endingInfo[id].label,
      location: endingInfo[id].title,
      locationKey: wedding ? "wedding" : id === "enemy" ? "dungeon" : "portal",
      expression: id === "enemy" ? "disappointed" : id === "neutral" ? "neutral" : id === "friend" ? "smile" : "love",
      portraitVariant: wedding ? "wedding" : null,
      speaker: () => wedding ? "{name}" : "",
      endingId: id,
      body: () => text.split("\n\n").map(x => `<p>${T(x)}</p>`).join(""),
      ending: true
    };
  }

  // Patch route selection effects after scene creation so they can set a top-level field.
  function applyChoiceEffects(choice) {
    if (choice.effects) {
      if (choice.effects.route) state.route = choice.effects.route;
      effects(choice.effects);
    }
  }

  function showScreen(which) {
    titleScreen.classList.toggle("hidden", which !== "title");
    gameScreen.classList.toggle("hidden", which !== "game");
    endingsScreen.classList.toggle("hidden", which !== "endings");
  }

  function setBackground(key) {
    document.body.dataset.location = key || "title";
  }

  function updateTitle() {
    const continueBtn = $("continueBtn");
    if (!state || !state.active) {
      continueBtn.disabled = true;
      continueBtn.textContent = "Continue";
    } else if (state.ended) {
      continueBtn.disabled = false;
      continueBtn.textContent = "View Completed Ending";
    } else {
      continueBtn.disabled = false;
      continueBtn.textContent = "Continue";
    }
    const discovered = Object.keys(meta.discovered || {}).length;
    const secretKnown = !!meta.discovered.marriage;
    $("endingCounter").textContent = secretKnown ? `Endings discovered: ${discovered} / 6` : `Endings discovered: ${discovered} / ???`;
  }

  function startNewGame() {
    state = freshState();
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    showScreen("game");
    renderScene();
  }

  function ensureOnEnter(node) {
    if (!node.onEnter) return;
    const key = `__entered_${state.scene}`;
    if (!state.committed[key]) {
      node.onEnter();
      state.committed[key] = true;
      persist();
    }
  }

  function renderScene() {
    if (!state) return;
    const node = scenes[state.scene];
    if (!node) {
      console.error("Unknown scene", state.scene);
      return;
    }

    ensureOnEnter(node);
    showScreen("game");
    setBackground(node.locationKey || "castle");
    chapterLabel.textContent = T(node.chapter || "");
    locationLabel.textContent = T(node.location || "");
    heartglassText.textContent = heartglassMood();

    if (state.pending) {
      renderPending(node);
      return;
    }

    const hasPortrait = node.portrait !== false && !!state.route;
    portraitPanel.classList.toggle("hidden", !hasPortrait);
    if (hasPortrait) {
      const exp = typeof node.expression === "function" ? node.expression(state) : (node.expression || "neutral");
      const src = sprite(exp, node.portraitVariant || null);
      portrait.src = src;
      portrait.alt = `${dateable().name} — ${exp} expression`;
      nameplate.textContent = dateable().name;
      portraitPanel.setAttribute("aria-hidden", "false");
    } else {
      portrait.removeAttribute("src");
      portrait.alt = "";
      nameplate.textContent = "";
      portraitPanel.setAttribute("aria-hidden", "true");
    }

    speaker.textContent = T(typeof node.speaker === "function" ? node.speaker(state) : (node.speaker || ""));
    storyText.innerHTML = T(typeof node.body === "function" ? node.body(state) : node.body);
    choicesEl.innerHTML = "";
    continueStoryBtn.classList.add("hidden");

    if (node.ending) {
      unlockEnding(node.endingId);
      state.ended = true;
      persist();
      continueStoryBtn.textContent = "Return to Title";
      continueStoryBtn.dataset.mode = "title";
      continueStoryBtn.classList.remove("hidden");
      return;
    }

    const available = (node.choices || []).filter(c => !c.condition || c.condition(state));
    available.forEach((choice, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.dataset.key = String(index + 1);
      btn.dataset.choiceId = choice.id;
      btn.innerHTML = T(typeof choice.text === "function" ? choice.text(state) : choice.text);
      if (choice.note) {
        const note = document.createElement("span");
        note.className = "choice-note";
        note.textContent = T(choice.note);
        btn.appendChild(note);
      }
      btn.addEventListener("click", () => commitChoice(choice, btn));
      choicesEl.appendChild(btn);
    });
  }

  function commitChoice(choice, clickedButton) {
    if (!state || state.pending) return;
    const sceneId = state.scene;
    if (state.committed[sceneId]) return;

    [...choicesEl.querySelectorAll("button")].forEach(b => b.disabled = true);
    clickedButton.classList.add("locked");

    applyChoiceEffects(choice);
    state.committed[sceneId] = choice.id;
    state.history.push({ scene: sceneId, choice: choice.id, at: Date.now() });

    let outcome;
    if (typeof choice.reaction === "function") outcome = choice.reaction(state);
    else outcome = reaction(choice.reaction || "", choice.reactionExpression || "neutral", choice.next || null);

    if (outcome.setRoute) state.route = outcome.setRoute;
    let next = typeof outcome.next === "function" ? outcome.next(state) : outcome.next;

    // Once severe trust damage crosses the line, the story branches to the dungeon.
    if (shouldDungeon() && !["dungeon_arrival", "dungeon_wait", "ending_enemy"].includes(next)) {
      next = "dungeon_arrival";
    }

    state.pending = {
      scene: sceneId,
      text: T(outcome.text || ""),
      expression: outcome.expression || "neutral",
      next: next || "",
      portraitVariant: outcome.portraitVariant || null,
      speaker: outcome.speaker != null ? T(outcome.speaker) : T(typeof node.speaker === "function" ? node.speaker(state) : (node.speaker || ""))
    };
    persist();
    renderScene();
  }

  function renderPending(node) {
    const pending = state.pending;
    const hasPortrait = node.portrait !== false && !!state.route;
    portraitPanel.classList.toggle("hidden", !hasPortrait);
    if (hasPortrait) {
      portrait.src = sprite(pending.expression || "neutral", pending.portraitVariant || null);
      portrait.alt = `${dateable().name} — ${pending.expression || "neutral"} expression`;
      nameplate.textContent = dateable().name;
    }
    speaker.textContent = pending.speaker || "";
    storyText.innerHTML = pending.text;
    choicesEl.innerHTML = "";
    continueStoryBtn.textContent = "Continue";
    continueStoryBtn.dataset.mode = "next";
    continueStoryBtn.classList.remove("hidden");
  }

  function continueStory() {
    if (!state) return;
    if (continueStoryBtn.dataset.mode === "title") {
      showTitle();
      return;
    }
    if (!state.pending) return;
    const next = state.pending.next;
    state.pending = null;
    if (!next) {
      showTitle();
      return;
    }
    state.scene = next;
    persist();
    renderScene();
  }

  function unlockEnding(id) {
    if (!id || meta.discovered[id]) return;
    meta.discovered[id] = { firstSeen: Date.now(), route: state.route };
    saveMeta(meta);
  }

  function showTitle() {
    setBackground("title");
    showScreen("title");
    updateTitle();
  }

  function showEndings(returnTarget = "title") {
    endingReturnTarget = returnTarget;
    const grid = $("endingGrid");
    grid.innerHTML = "";
    const secretKnown = !!meta.discovered.marriage;
    const ids = ["enemy", "neutral", "friend", "romance", "engaged"];
    if (secretKnown) ids.push("marriage");
    else ids.push("secret_locked");

    ids.forEach(id => {
      const tile = document.createElement("article");
      tile.className = "ending-tile";
      if (id === "secret_locked") {
        tile.classList.add("locked");
        tile.innerHTML = `<div class="ending-icon">✦</div><h3>???</h3><p>There may be a path the Heartglass has not yet revealed.</p>`;
      } else {
        const found = !!meta.discovered[id];
        if (!found) tile.classList.add("locked");
        const info = endingInfo[id];
        tile.innerHTML = found
          ? `<div class="ending-icon">${info.icon}</div><h3>${info.title}</h3><p>${info.label}<br>${info.text}</p>`
          : `<div class="ending-icon">◇</div><h3>Locked</h3><p>${info.label}</p>`;
      }
      grid.appendChild(tile);
    });

    setBackground("castle");
    showScreen("endings");
  }

  function openMenu() {
    $("modalBackdrop").classList.remove("hidden");
    $("menuModal").classList.remove("hidden");
    $("confirmModal").classList.add("hidden");
  }

  function closeMenu() {
    $("modalBackdrop").classList.add("hidden");
  }

  function askRestart() {
    $("menuModal").classList.add("hidden");
    $("confirmModal").classList.remove("hidden");
  }

  function cancelRestart() {
    $("confirmModal").classList.add("hidden");
    $("menuModal").classList.remove("hidden");
  }

  function confirmRestart() {
    closeMenu();
    startNewGame();
  }

  $("continueBtn").addEventListener("click", () => {
    if (!state) return;
    renderScene();
  });
  $("newGameBtn").addEventListener("click", () => {
    if (state && state.active && !state.ended) {
      openMenu();
      askRestart();
    } else {
      startNewGame();
    }
  });
  $("endingsBtn").addEventListener("click", () => showEndings("title"));
  $("closeEndingsBtn").addEventListener("click", () => {
    if (endingReturnTarget === "game" && state) renderScene(); else showTitle();
  });
  $("menuBtn").addEventListener("click", openMenu);
  $("resumeBtn").addEventListener("click", closeMenu);
  $("viewEndingsFromMenuBtn").addEventListener("click", () => {
    closeMenu();
    showEndings("game");
  });
  $("restartBtn").addEventListener("click", askRestart);
  $("cancelRestartBtn").addEventListener("click", cancelRestart);
  $("confirmRestartBtn").addEventListener("click", confirmRestart);
  continueStoryBtn.addEventListener("click", continueStory);

  // Number keys choose visible dialogue options. Enter/Space continues reaction text.
  window.addEventListener("keydown", (event) => {
    if (gameScreen.classList.contains("hidden")) return;
    if (!$("modalBackdrop").classList.contains("hidden")) return;
    if (state && state.pending && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      continueStory();
      return;
    }
    const n = Number(event.key);
    if (n >= 1 && n <= 9 && !state?.pending) {
      const buttons = [...choicesEl.querySelectorAll("button:not(:disabled)")];
      if (buttons[n - 1]) buttons[n - 1].click();
    }
  });

  // The story never pushes dialogue into browser history. Navigating away and returning
  // simply reloads the autosaved current scene; previous choices cannot be revisited.
  history.replaceState({ heartglass: true }, "", location.href);

  updateTitle();
  showTitle();
})();
