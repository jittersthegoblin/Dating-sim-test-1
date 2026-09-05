(() => {
  "use strict";

  const GALLERY_KEY = "heartglass_gallery_v1";
  const RUN_KEY = "heartglass_run_v1";
  const META_KEY = "heartglass_meta_v1";

  const routes = {
    male: { name: "Caelan" },
    female: { name: "Caelia" }
  };

  const endings = [
    { id: "enemy", icon: "💔", title: "Enemies", label: "Bad Ending" },
    { id: "neutral", icon: "🌙", title: "Two Passing Worlds", label: "Neutral Ending" },
    { id: "friend", icon: "🫶", title: "Across Any Distance", label: "Friend Ending" },
    { id: "romance", icon: "💕", title: "A Heart Between Worlds", label: "Romance Ending" },
    { id: "engaged", icon: "💍", title: "A Promise Under Starlight", label: "Engaged Ending" },
    { id: "marriage", icon: "✨", title: "Wherever You Are Is Home", label: "Secret / Best Ending", secret: true }
  ];

  const routeIds = Object.keys(routes);
  const endingIds = endings.map(x => x.id);

  function imageFor(route, ending) {
    if (ending === "marriage") return `assets/sprites/${route}_wedding.png`;
    return `assets/endings/${route}_${ending}.webp`;
  }

  function altFor(route, ending) {
    const name = routes[route]?.name || "The fae";
    const text = {
      enemy: `${name} looks sadly back through the portal with their arms crossed.`,
      neutral: `${name} gives a calm, polite wave through the portal.`,
      friend: `${name} smiles and waves warmly through the portal.`,
      romance: `${name} looks up from a book, delighted that the player has returned.`,
      engaged: `${name} looks up from a book with a deeply loving expression as the player returns.`,
      marriage: `${name} in wedding attire, holding out their hand toward the player.`
    };
    return text[ending] || `${name} ending illustration.`;
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (_) {
      return fallback;
    }
  }

  function loadGallery() {
    const data = readJson(GALLERY_KEY, null);
    return data && data.unlocked ? data : { unlocked: {} };
  }

  function saveGallery(data) {
    localStorage.setItem(GALLERY_KEY, JSON.stringify(data));
  }

  function galleryKey(route, ending) {
    return `${route}_${ending}`;
  }

  function isValidPair(route, ending) {
    return routeIds.includes(route) && endingIds.includes(ending);
  }

  function unlock(route, ending, source = "ending") {
    if (!isValidPair(route, ending)) return false;
    const gallery = loadGallery();
    const key = galleryKey(route, ending);
    if (gallery.unlocked[key]) return false;
    gallery.unlocked[key] = { firstSeen: Date.now(), source };
    saveGallery(gallery);
    return true;
  }

  function endingFromScene(scene) {
    const match = /^ending_(enemy|neutral|friend|romance|engaged|marriage)$/.exec(scene || "");
    return match ? match[1] : null;
  }

  function syncUnlocks() {
    // The current playthrough is authoritative. Only the exact route currently
    // being played may unlock the ending scene the player actually reached.
    const run = readJson(RUN_KEY, null);
    if (run && routeIds.includes(run.route)) {
      const ending = endingFromScene(run.scene);
      if (ending) unlock(run.route, ending, "current-run");
    }

    // Preserve endings discovered before the gallery existed. The old
    // storybook stores the route that first discovered an ending, so migrate
    // only that exact route rather than unlocking both versions.
    const meta = readJson(META_KEY, null);
    const discovered = meta?.discovered || {};
    for (const [ending, record] of Object.entries(discovered)) {
      if (endingIds.includes(ending) && routeIds.includes(record?.route)) {
        unlock(record.route, ending, "storybook-migration");
      }
    }
  }

  function installGalleryUi() {
    if (document.getElementById("galleryOverlay")) return;

    const titleActions = document.querySelector(".title-actions");
    if (titleActions && !document.getElementById("galleryBtn")) {
      const button = document.createElement("button");
      button.id = "galleryBtn";
      button.className = "btn ghost";
      button.type = "button";
      button.textContent = "Gallery";
      button.addEventListener("click", openGallery);
      titleActions.appendChild(button);
    }

    const menuActions = document.querySelector("#menuModal .modal-actions");
    if (menuActions && !document.getElementById("galleryMenuBtn")) {
      const button = document.createElement("button");
      button.id = "galleryMenuBtn";
      button.className = "btn";
      button.type = "button";
      button.textContent = "Gallery";
      button.addEventListener("click", () => {
        document.getElementById("modalBackdrop")?.classList.add("hidden");
        openGallery();
      });
      const restart = document.getElementById("restartBtn");
      menuActions.insertBefore(button, restart || null);
    }

    const overlay = document.createElement("section");
    overlay.id = "galleryOverlay";
    overlay.className = "gallery-overlay hidden";
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-labelledby", "galleryTitle");
    overlay.innerHTML = `
      <div class="gallery-shell glass-card">
        <header class="gallery-header">
          <div>
            <p class="eyebrow">Memories across the veil</p>
            <h2 id="galleryTitle">Ending Gallery</h2>
            <p id="galleryProgress" class="gallery-progress"></p>
          </div>
          <button id="closeGalleryBtn" class="icon-btn" type="button" aria-label="Close gallery">×</button>
        </header>
        <p class="gallery-note">Each Caelan and Caelia illustration unlocks separately when you discover that ending on their route.</p>
        <div id="galleryGrid" class="gallery-grid"></div>
      </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById("closeGalleryBtn")?.addEventListener("click", closeGallery);
    overlay.addEventListener("click", event => {
      if (event.target === overlay) closeGallery();
    });

    const lightbox = document.createElement("div");
    lightbox.id = "galleryLightbox";
    lightbox.className = "gallery-lightbox hidden";
    lightbox.setAttribute("aria-modal", "true");
    lightbox.setAttribute("role", "dialog");
    lightbox.innerHTML = `
      <button id="closeGalleryLightbox" class="gallery-lightbox-close" type="button" aria-label="Close image">×</button>
      <figure>
        <img id="galleryLightboxImage" alt="" />
        <figcaption id="galleryLightboxCaption"></figcaption>
      </figure>
    `;
    document.body.appendChild(lightbox);
    document.getElementById("closeGalleryLightbox")?.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", event => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  function openGallery() {
    syncUnlocks();
    renderGallery();
    document.getElementById("galleryOverlay")?.classList.remove("hidden");
    document.body.classList.add("gallery-open");
  }

  function closeGallery() {
    document.getElementById("galleryOverlay")?.classList.add("hidden");
    document.body.classList.remove("gallery-open");
    closeLightbox();
  }

  function openLightbox(route, ending) {
    if (!isValidPair(route, ending)) return;
    const info = endings.find(x => x.id === ending);
    const img = document.getElementById("galleryLightboxImage");
    const caption = document.getElementById("galleryLightboxCaption");
    if (!img || !caption || !info) return;
    img.src = imageFor(route, ending);
    img.alt = altFor(route, ending);
    caption.textContent = `${info.title} — ${routes[route].name}`;
    document.getElementById("galleryLightbox")?.classList.remove("hidden");
  }

  function closeLightbox() {
    document.getElementById("galleryLightbox")?.classList.add("hidden");
    const img = document.getElementById("galleryLightboxImage");
    if (img) img.removeAttribute("src");
  }

  function renderGallery() {
    const grid = document.getElementById("galleryGrid");
    const progress = document.getElementById("galleryProgress");
    if (!grid || !progress) return;

    const gallery = loadGallery();
    const unlocked = gallery.unlocked || {};
    const count = endings.reduce((total, info) => {
      return total + routeIds.filter(route => !!unlocked[galleryKey(route, info.id)]).length;
    }, 0);
    progress.textContent = `${count} / 12 ending memories unlocked`;
    grid.innerHTML = "";

    endings.forEach(info => {
      const group = document.createElement("section");
      group.className = "gallery-ending-group";
      const marriageKnown = !!unlocked[galleryKey("male", "marriage")] || !!unlocked[galleryKey("female", "marriage")];
      const hiddenSecret = info.secret && !marriageKnown;
      group.innerHTML = `
        <div class="gallery-ending-heading">
          <span class="gallery-ending-icon">${hiddenSecret ? "✦" : info.icon}</span>
          <div><h3>${hiddenSecret ? "???" : info.title}</h3><p>${hiddenSecret ? "A hidden ending" : info.label}</p></div>
        </div>
        <div class="gallery-route-row"></div>
      `;

      const row = group.querySelector(".gallery-route-row");
      routeIds.forEach(route => {
        const key = galleryKey(route, info.id);
        const found = !!unlocked[key];
        const card = document.createElement(found ? "button" : "article");
        card.className = `gallery-card ${found ? "unlocked" : "locked"}`;
        if (found) {
          card.type = "button";
          card.setAttribute("aria-label", `Open ${info.title} illustration for ${routes[route].name}`);
          const imageClass = info.id === "marriage" ? " gallery-wedding-image" : "";
          card.innerHTML = `
            <div class="gallery-thumb"><img class="${imageClass.trim()}" src="${imageFor(route, info.id)}" alt="${altFor(route, info.id)}" loading="lazy" /></div>
            <div class="gallery-card-copy"><strong>${routes[route].name}</strong><span>View memory</span></div>
          `;
          card.addEventListener("click", () => openLightbox(route, info.id));
        } else {
          card.innerHTML = `
            <div class="gallery-thumb gallery-locked-thumb"><span>◇</span></div>
            <div class="gallery-card-copy"><strong>${hiddenSecret ? "???" : routes[route].name}</strong><span>Locked</span></div>
          `;
        }
        row.appendChild(card);
      });

      grid.appendChild(group);
    });
  }

  function start() {
    installGalleryUi();
    syncUnlocks();

    window.addEventListener("storage", event => {
      if ([RUN_KEY, META_KEY, GALLERY_KEY].includes(event.key)) syncUnlocks();
    });

    window.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      if (!document.getElementById("galleryLightbox")?.classList.contains("hidden")) closeLightbox();
      else if (!document.getElementById("galleryOverlay")?.classList.contains("hidden")) closeGallery();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
