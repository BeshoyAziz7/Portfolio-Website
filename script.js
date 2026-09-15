// ====== PARTICLES ======
(function createParticles() {
  const container = document.getElementById("particles");
  if (!container) return;

  const count = 30;
  for (let i = 0; i < count; i++) {
    const particle = document.createElement("div");
    particle.classList.add("particle");
    const size = Math.random() * 4 + 2;
    particle.style.width = size + "px";
    particle.style.height = size + "px";
    particle.style.left = Math.random() * 100 + "%";
    particle.style.animationDuration = Math.random() * 15 + 10 + "s";
    particle.style.animationDelay = Math.random() * 10 + "s";
    particle.style.opacity = Math.random() * 0.5 + 0.1;
    container.appendChild(particle);
  }
})();

// ====== HERO MARQUEE ======
(function buildMarquee() {
  const track = document.getElementById("heroMarquee");
  if (!track) return;
  const roles = [
    "Web Developer",
    "UI/UX Designer",
    "Game Designer",
    "VR / AR Developer",
    "Front-End Developer",
  ];
  const buildSet = () =>
    roles
      .map(
        (r) =>
          `<span class="hero-marquee-item"><span class="dot">●</span>${r}</span>`,
      )
      .join("");
  track.innerHTML = buildSet() + buildSet();
})();

// ====== GLYPH PORTAL (scroll-driven hero) ======
(function initGlyphPortal() {
  const section = document.querySelector(".hero.glyph-portal");
  if (!section) return;

  const clamp = (n, a = 0, b = 1) => Math.min(b, Math.max(a, n));
  const smooth = (a, b, n) => {
    const t = clamp((n - a) / (b - a));
    return t * t * (3 - 2 * t);
  };

  function interior(ctx, char, font) {
    const canvas = ctx.canvas;
    ctx.font = font;
    const m = ctx.measureText(char);
    const pad = 8;
    const left = Math.ceil(m.actualBoundingBoxLeft);
    const ascent = Math.ceil(m.actualBoundingBoxAscent);
    canvas.width = Math.max(
      1,
      Math.ceil(m.actualBoundingBoxLeft + m.actualBoundingBoxRight) + pad * 2,
    );
    canvas.height = Math.max(
      1,
      Math.ceil(m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) +
        pad * 2,
    );
    ctx.font = font;
    ctx.fontKerning = "none";
    ctx.fillText(char, pad + left, pad + ascent);
    const { width, height } = canvas;
    const pixels = ctx.getImageData(0, 0, width, height).data;
    const rows = new Uint16Array(width + 1);
    let size = 0,
      bx = 0,
      by = 0;
    for (let y = 0; y < height; y++) {
      let diagonal = 0;
      for (let x = 0; x < width; x++) {
        const above = rows[x + 1];
        rows[x + 1] =
          pixels[(y * width + x) * 4 + 3] > 245
            ? Math.min(above, rows[x], diagonal) + 1
            : 0;
        diagonal = above;
        if (rows[x + 1] > size) {
          size = rows[x + 1];
          bx = x;
          by = y;
        }
      }
    }
    if (size < 3) return null;
    return {
      x: (bx + 1 - size / 2 - pad - left) / 3,
      y: (by + 1 - size / 2 - pad - ascent) / 3,
      radius: (size / 2 - 1) / 3,
    };
  }

  // ====== ABOUT — CINEMATIC SCROLL STORY ======
  (function initAboutStory() {
    const wrap = document.getElementById("aboutStory");
    const sticky = document.getElementById("aboutStorySticky");
    if (!wrap || !sticky) return;

    const chapters = Array.from(wrap.querySelectorAll(".about-chapter"));
    const orbitBadges = Array.from(wrap.querySelectorAll(".about-orbit-badge"));
    const progressLabels = Array.from(
      wrap.querySelectorAll(".progress-chapter"),
    );
    const progressFill = document.getElementById("aboutProgressFill");
    const beatCount = chapters.length;

    // Badges are always visible — show them immediately and never toggle them again.
    orbitBadges.forEach((b) => b.classList.add("active"));

    const accents = [
      { solid: "rgba(139, 92, 246, 0.6)", soft: "rgba(139, 92, 246, 0.25)" },
      { solid: "rgba(236, 72, 153, 0.6)", soft: "rgba(236, 72, 153, 0.25)" },
      { solid: "rgba(34, 211, 238, 0.6)", soft: "rgba(34, 211, 238, 0.25)" },
      { solid: "rgba(251, 146, 60, 0.6)", soft: "rgba(251, 146, 60, 0.25)" },
    ];

    let countersFired = false;
    function fireCounters() {
      if (countersFired) return;
      countersFired = true;
      wrap.querySelectorAll("[data-count-to]").forEach((el) => {
        const target = parseFloat(el.dataset.countTo) || 0;
        const suffix = el.dataset.suffix || "";
        const duration = 1100;
        const start = performance.now();
        function tick(now) {
          const p = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }

    function setActiveBeat(beatIndex) {
      chapters.forEach((ch) => {
        const isActive = Number(ch.dataset.beat) === beatIndex;
        ch.classList.toggle("active", isActive);
        ch.setAttribute("aria-hidden", String(!isActive));
      });
      progressLabels.forEach((p) =>
        p.classList.toggle("active", Number(p.dataset.beat) === beatIndex),
      );
      const accent = accents[beatIndex] || accents[0];
      wrap.style.setProperty("--story-accent", accent.solid);
      wrap.style.setProperty("--story-accent-soft", accent.soft);
      if (beatIndex === 2) fireCounters();
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion || !window.gsap || !window.ScrollTrigger) {
      chapters.forEach((ch) => ch.classList.add("active"));
      const statChapter = chapters.find((ch) => ch.dataset.beat === "2");
      if (statChapter) {
        const io = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                fireCounters();
                io.disconnect();
              }
            });
          },
          { threshold: 0.35 },
        );
        io.observe(statChapter);
      }
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    setActiveBeat(0);

    ScrollTrigger.create({
      trigger: wrap,
      start: "top top",
      end: "bottom bottom",
      scrub: 0.4,
      onUpdate(self) {
        const raw = self.progress;
        const scaled = raw * beatCount;
        let beatIndex = Math.floor(scaled);
        if (beatIndex >= beatCount) beatIndex = beatCount - 1;
        if (beatIndex < 0) beatIndex = 0;
        setActiveBeat(beatIndex);
        if (progressFill) progressFill.style.width = raw * 100 + "%";
      },
    });

    window.addEventListener("load", () => ScrollTrigger.refresh());
  })();

  const word = (section.dataset.word || "BESHOY").trim();
  const focusChar = section.dataset.focusChar || null;
  const interactive = section.dataset.interactive !== "false";
  const scrollLength = clamp(
    parseFloat(section.dataset.scrollLength) || 2.2,
    1,
    8,
  );
  const fontFamily = section.dataset.fontFamily || "'Playfair Display', serif";
  const fontWeight = clamp(
    parseFloat(section.dataset.fontWeight) || 900,
    1,
    1000,
  );
  const uid = "gp-" + Math.random().toString(36).slice(2, 9);

  const pin = section.querySelector(".gp-pin");
  const field = section.querySelector(".gp-field");
  const art = section.querySelector(".gp-art");
  const clipPathEl = section.querySelector(".gp-clip");
  const glyph = section.querySelector(".gp-glyph");
  const marks = section.querySelector(".gp-marks");
  const markPath = marks.querySelector("path");
  const choices = section.querySelector(".gp-choices");
  const picker = section.querySelector(".gp-select");
  const viewportProbe = section.querySelector(".gp-viewport");
  const fallback = section.querySelector(".gp-fallback");

  clipPathEl.id = uid + "-clip";
  field.style.clipPath = "url(#" + clipPathEl.id + ")";

  const chars = Array.from(word || "BESHOY");
  const text = chars.join("");
  glyph.textContent = text;
  glyph.style.fontFamily = fontFamily;
  glyph.style.fontWeight = fontWeight;
  glyph.setAttribute("font-size", "100");
  glyph.style.fontKerning = "none";
  fallback.textContent = text;
  section.style.setProperty("--gp-characters", chars.length);
  section.style.setProperty("--gp-length", scrollLength);

  choices.innerHTML = "";
  picker.innerHTML =
    '<option value="" disabled selected>Choose a letter</option>';
  chars.forEach((char, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.setAttribute("role", "radio");
    btn.setAttribute("aria-checked", "false");
    btn.tabIndex = -1;
    btn.dataset.letter = i;
    btn.setAttribute(
      "aria-label",
      char + ", letter " + (i + 1) + " of " + chars.length,
    );
    choices.appendChild(btn);
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = i + 1 + " · " + char;
    picker.appendChild(opt);
  });
  const buttons = Array.from(choices.querySelectorAll("button"));

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let disposed = false,
    raf = 0,
    dirty = true,
    active = true,
    ready = false,
    fontDirty = true;
  let target = null,
    candidates = [],
    letters = [],
    choosing = false;
  let bounds = { x: 0, y: 0, width: 1, height: 1 },
    center = { x: 0, y: 0 };
  let startScale = 1,
    endScale = 1,
    W = 1,
    H = 1,
    travel = 1;

  function readInk() {
    if (!ctx) return false;
    const cs = getComputedStyle(glyph);
    const scanFont = cs.fontWeight + " 300px " + cs.fontFamily;
    ctx.font = cs.fontWeight + " 100px " + cs.fontFamily;
    ctx.fontKerning = "none";
    const metrics = ctx.measureText(text);
    const advances = Array.from(
      { length: text.length },
      (_, i) => ctx.measureText(text.slice(0, i)).width,
    );
    bounds = {
      x: -metrics.actualBoundingBoxLeft,
      y: -metrics.actualBoundingBoxAscent,
      width: metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight,
      height:
        metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
    };
    if (!bounds.width || !bounds.height) return false;
    center = {
      x: bounds.x + bounds.width / 2,
      y: bounds.y + bounds.height / 2,
    };
    const requested = focusChar ? text.indexOf(focusChar) : -1;
    let offset = 0;
    candidates = [];
    letters = [];
    for (const char of Array.from(text)) {
      ctx.font = cs.fontWeight + " 100px " + cs.fontFamily;
      const m = ctx.measureText(char);
      letters.push({
        index: offset,
        x: advances[offset] - m.actualBoundingBoxLeft,
        y: -m.actualBoundingBoxAscent,
        width: m.actualBoundingBoxLeft + m.actualBoundingBoxRight,
        height: m.actualBoundingBoxAscent + m.actualBoundingBoxDescent,
      });
      const found = interior(ctx, char, scanFont);
      if (found)
        candidates.push(
          Object.assign({}, found, {
            x: found.x + advances[offset],
            index: offset,
          }),
        );
      offset += char.length;
    }
    target =
      candidates.find((c) => c.index === requested) ||
      candidates
        .slice()
        .sort(
          (a, b) =>
            b.radius - a.radius ||
            Math.abs(a.x - center.x) - Math.abs(b.x - center.x),
        )[0] ||
      null;
    return true;
  }

  function select(next) {
    target = next;
    endScale = next
      ? Math.max(startScale, Math.hypot(W, H) / (next.radius * 1.35))
      : startScale;
    buttons.forEach((btn) => {
      const selected = !!next && Number(btn.dataset.letter) === next.index;
      btn.disabled = !candidates.some(
        (c) => c.index === Number(btn.dataset.letter),
      );
      btn.setAttribute("aria-checked", String(selected));
      btn.tabIndex = selected ? 0 : -1;
    });
    if (picker.value !== "") picker.value = String(next ? next.index : -1);
    Array.from(picker.options).forEach((opt) => {
      opt.disabled =
        opt.value === "" ||
        !candidates.some((c) => c.index === Number(opt.value));
    });
    const u = 1 / startScale;
    const y = bounds.y + bounds.height + 25 * u;
    const x = bounds.x,
      right = x + bounds.width;
    const cross = next
      ? "M" +
        (next.x - 9 * u) +
        " " +
        next.y +
        "h" +
        18 * u +
        "M" +
        next.x +
        " " +
        (next.y - 9 * u) +
        "v" +
        18 * u
      : "";
    markPath.setAttribute(
      "d",
      "M" +
        x +
        " " +
        y +
        "H" +
        right +
        "M" +
        x +
        " " +
        (y - 5 * u) +
        "v" +
        10 * u +
        "M" +
        right +
        " " +
        (y - 5 * u) +
        "v" +
        10 * u +
        cross,
    );
    markPath.setAttribute("stroke-width", String(u));
  }

  function position() {
    return clamp((0 - section.getBoundingClientRect().top) / travel);
  }

  function paint(progress) {
    const isStatic = motion.matches || !target;
    const p = isStatic ? 0 : progress;
    const t = clamp(p / 0.78);
    const eased = t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
    const scale = Math.exp(
      Math.log(startScale) + Math.log(endScale / startScale) * eased,
    );
    const blend =
      endScale === startScale
        ? 0
        : (1 / scale - 1 / startScale) / (1 / endScale - 1 / startScale);
    const cx = center.x + ((target ? target.x : center.x) - center.x) * blend;
    const cy = center.y + ((target ? target.y : center.y) - center.y) * blend;
    const roll = -4 * smooth(0.06, 0.5, t) * (1 - smooth(0.62, 0.92, t));
    const radians = (roll * Math.PI) / 180;
    const dx = W / 2 / scale,
      dy = (H * 0.46 + H * 0.04 * eased) / scale;
    clipPathEl.setAttribute(
      "transform",
      "scale(" + scale + ") rotate(" + roll + ")",
    );
    glyph.setAttribute(
      "transform",
      "translate(" +
        (Math.cos(radians) * dx + Math.sin(radians) * dy - cx) +
        " " +
        (-Math.sin(radians) * dx + Math.cos(radians) * dy - cy) +
        ")",
    );
    marks.setAttribute(
      "transform",
      "translate(" +
        W / 2 +
        " " +
        (H * 0.46 + H * 0.04 * eased) +
        ") scale(" +
        scale +
        ") rotate(" +
        roll +
        ") translate(" +
        -cx +
        " " +
        -cy +
        ")",
    );
    marks.style.opacity = String(1 - smooth(0.015, 0.17, p));
    choosing = interactive && !isStatic && p < 0.04;
    choices.style.pointerEvents = choosing ? "auto" : "none";
    section.dataset.gpChoosing = String(choosing);
    field.style.clipPath = t >= 1 ? "none" : "url(#" + clipPathEl.id + ")";
    section.style.setProperty(
      "--gp-caption",
      String(1 - smooth(0.01, 0.16, p)),
    );
    section.style.setProperty(
      "--gp-reveal",
      String(isStatic ? 1 : smooth(0.78, 0.9, p)),
    );
    section.style.setProperty(
      "--gp-field-scale",
      String(1 + 0.16 * smooth(0, 0.82, p)),
    );
    section.style.setProperty("--gp-caption-hit", p < 0.08 ? "auto" : "none");
    section.dataset.gpEntered = String(p >= 0.9);
  }

  function layout() {
    if (!section.clientWidth) return;
    W = pin.clientWidth;
    const smallViewport = viewportProbe.offsetHeight;
    const viewportHeight = Math.max(1, smallViewport);
    H = motion.matches ? Math.min(viewportHeight * 0.75, 480) : viewportHeight;
    section.style.setProperty("--gp-height", H + "px");
    travel = H * scrollLength;
    art.setAttribute("viewBox", "0 0 " + W + " " + H);
    if (fontDirty) {
      ready = readInk();
      fontDirty = false;
    }
    if (!ready) return;
    const wordHeight = H * 0.38;
    startScale = Math.min(
      (W * 0.84) / bounds.width,
      wordHeight / bounds.height,
    );
    select(target);
    letters.forEach((letter) => {
      const btn = buttons.find(
        (b) => Number(b.dataset.letter) === letter.index,
      );
      if (!btn) return;
      Object.assign(btn.style, {
        left: W / 2 + (letter.x - center.x) * startScale + "px",
        top:
          H * 0.46 +
          (letter.y - center.y) * startScale -
          Math.max(0, 44 - letter.height * startScale) / 2 +
          "px",
        width: Math.max(1, letter.width * startScale) + "px",
        height: Math.max(44, letter.height * startScale) + "px",
      });
    });
    section.style.setProperty(
      "--gp-word-top",
      H * 0.46 - (bounds.height * startScale) / 2 + "px",
    );
    section.style.setProperty(
      "--gp-word-bottom",
      H * 0.46 + (bounds.height * startScale) / 2 + "px",
    );
    section.dataset.gpReady = "true";
    section.dataset.gpMotion = !motion.matches && target ? "on" : "off";
  }

  function frame() {
    raf = 0;
    if (disposed) return;
    if (dirty) {
      dirty = false;
      layout();
    }
    if (ready) paint(position());
  }
  function schedule() {
    if (!raf && active) raf = requestAnimationFrame(frame);
  }
  function onResize() {
    cancelAnimationFrame(raf);
    raf = 0;
    dirty = true;
    frame();
    if (window.ScrollTrigger) ScrollTrigger.refresh();
  }
  function onScroll() {
    schedule();
  }

  function onChoose(e) {
    if (!choosing || position() >= 0.04) return;
    const btn = e.target.closest("[data-letter]");
    if (!btn) return;
    const next = candidates.find((c) => c.index === Number(btn.dataset.letter));
    if (!next || next === target) return;
    select(next);
    paint(position());
  }
  function onKey(e) {
    if (
      !choosing ||
      ![
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        "Home",
        "End",
      ].includes(e.key)
    )
      return;
    e.preventDefault();
    const current = candidates.indexOf(target);
    const index =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? candidates.length - 1
          : (current +
              (e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1) +
              candidates.length) %
            candidates.length;
    const btn = buttons.find(
      (b) => Number(b.dataset.letter) === candidates[index].index,
    );
    if (btn) btn.focus({ preventScroll: true });
  }
  function onPick() {
    if (!choosing || position() >= 0.04) return;
    const next = candidates.find((c) => c.index === Number(picker.value));
    if (next) {
      select(next);
      paint(position());
    }
  }

  choices.addEventListener("pointerover", onChoose);
  choices.addEventListener("click", onChoose);
  choices.addEventListener("focusin", onChoose);
  choices.addEventListener("keydown", onKey);
  picker.addEventListener("change", onPick);

  new ResizeObserver(onResize).observe(section);

  new IntersectionObserver(
    ([entry]) => {
      active = entry.isIntersecting;
      if (active) {
        dirty = true;
        schedule();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    { rootMargin: "100% 0px" },
  ).observe(section);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize);
  window.visualViewport &&
    window.visualViewport.addEventListener("resize", onResize);
  motion.addEventListener("change", onResize);

  frame();
  schedule();

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      fontDirty = true;
      dirty = true;
      schedule();
      if (window.ScrollTrigger) ScrollTrigger.refresh();
    });
  }
  window.addEventListener("load", () => {
    dirty = true;
    schedule();
  });
})();

// ====== CUSTOM CURSOR ======
(function initCursor() {
  const prefersReduced = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const isCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
  if (prefersReduced || isCoarsePointer) return;
  const dot = document.getElementById("cursorDot");
  const ring = document.getElementById("cursorRing");
  if (!dot || !ring) return;
  let ringX = 0,
    ringY = 0,
    mouseX = 0,
    mouseY = 0;
  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.left = mouseX + "px";
    dot.style.top = mouseY + "px";
  });
  (function animateRing() {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;
    ring.style.left = ringX + "px";
    ring.style.top = ringY + "px";
    requestAnimationFrame(animateRing);
  })();
  document
    .querySelectorAll(
      "a, button, .dancing-letter, input, textarea, .gp-choices button, .gp-select",
    )
    .forEach((el) => {
      el.addEventListener("mouseenter", () => ring.classList.add("hovered"));
      el.addEventListener("mouseleave", () => ring.classList.remove("hovered"));
    });
})();

// ====== NAV / SCROLL / MOBILE ======
let currentSection = "home";
let isMenuOpen = false;
const navbar = document.getElementById("navbar");

// ====== SQUIGGLY UNDERLINE NAVIGATION ======
(function initSquigglyUnderline() {
  const svgNS = "http://www.w3.org/2000/svg";
  document.querySelectorAll(".nav-link").forEach((link, idx) => {
    const gradientId = `navSquigglyGradient-${idx}`;

    const svg = document.createElementNS(svgNS, "svg");
    svg.classList.add("nav-squiggly");
    svg.setAttribute("viewBox", "0 0 100 12");
    svg.setAttribute("preserveAspectRatio", "none");
    svg.setAttribute("aria-hidden", "true");

    svg.innerHTML = `
            <defs>
                <linearGradient id="${gradientId}" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stop-color="#8b5cf6"/>
                    <stop offset="55%" stop-color="#ec4899"/>
                    <stop offset="100%" stop-color="#22d3ee"/>
                </linearGradient>
            </defs>
            <path
                d="M1 6 Q 9 0, 17 6 T 33 6 T 49 6 T 65 6 T 81 6 T 99 6"
                pathLength="100"
                stroke="url(#${gradientId})"
            />
        `;

    link.appendChild(svg);
  });
})();

window.addEventListener("scroll", () => {
  if (window.scrollY > 50) navbar.classList.add("scrolled");
  else navbar.classList.remove("scrolled");
  updateActiveSection();
});

function scrollToSection(sectionId) {
  closeMobileMenu();
  if (sectionId === "home") window.scrollTo({ top: 0, behavior: "smooth" });
  else {
    const section = document.getElementById(sectionId);
    if (section) section.scrollIntoView({ behavior: "smooth" });
  }
  currentSection = sectionId;
  updateActiveNavLink();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateActiveSection() {
  const sections = ["home", "about", "skills", "projects"];
  const scrollPosition = window.scrollY + 200;
  sections.forEach((sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.offsetHeight;
      if (
        scrollPosition >= sectionTop &&
        scrollPosition < sectionTop + sectionHeight
      ) {
        if (currentSection !== sectionId) {
          currentSection = sectionId;
          updateActiveNavLink();
        }
      }
    }
  });
}

function updateActiveNavLink() {
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
    if (link.dataset.section === currentSection) link.classList.add("active");
  });
}

function toggleMobileMenu() {
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  isMenuOpen = !isMenuOpen;
  if (isMenuOpen) {
    mobileMenu.classList.add("open");
    mobileMenuBtn.classList.add("active");
    document.body.style.overflow = "hidden";
  } else {
    closeMobileMenu();
  }
}

function closeMobileMenu() {
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  isMenuOpen = false;
  mobileMenu.classList.remove("open");
  mobileMenuBtn.classList.remove("active");
  document.body.style.overflow = "";
}

document.querySelectorAll(".magnetic-btn").forEach((btn) => {
  btn.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px) scale(1.05)`;
  });
  btn.addEventListener("mouseleave", () => {
    btn.style.transform = "translate(0, 0) scale(1)";
  });
});

// ====== INTERSECTION OBSERVER ======
const observerOptions = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" };
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("active");

      if (entry.target.id === "skillsGrid") {
        const bars = entry.target.querySelectorAll(".skill-minibar-fill");
        bars.forEach((bar, index) => {
          const level = bar.parentElement.dataset.level || "80";
          setTimeout(
            () => {
              bar.style.width = level + "%";
            },
            index * 150 + 200,
          );
        });
      }

      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

document.addEventListener("click", (e) => {
  const mobileMenu = document.getElementById("mobileMenu");
  const mobileMenuBtn = document.getElementById("mobileMenuBtn");
  if (
    isMenuOpen &&
    !mobileMenu.contains(e.target) &&
    !mobileMenuBtn.contains(e.target)
  )
    closeMobileMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isMenuOpen) closeMobileMenu();
});

// ====== DANCING LETTERS ======
const dancingLettersElement = document.getElementById("dancingLetters");
const dancingText = "Web Developer";
const letterAnimations = [
  "anim-rubber-band",
  "anim-hinge",
  "anim-squash-jump",
  "anim-fall-rotate",
  "anim-elastic-slide",
  "anim-impact-shake",
  "anim-pop",
  "anim-levitate",
  "anim-wobble",
];

if (dancingLettersElement) {
  dancingLettersElement.innerHTML = "";
  dancingLettersElement.classList.add("dancing-letters-container");
  dancingLettersElement.classList.remove("hero-title");
  const letters = dancingText.split("");
  letters.forEach((letter, index) => {
    if (letter === " ") {
      const space = document.createElement("span");
      space.innerHTML = "&nbsp;";
      space.style.width = "0.5rem";
      dancingLettersElement.appendChild(space);
    } else {
      const letterSpan = document.createElement("span");
      letterSpan.textContent = letter;
      letterSpan.classList.add("dancing-letter");
      const animClass = letterAnimations[index % letterAnimations.length];
      letterSpan.dataset.animation = animClass;
      letterSpan.style.opacity = "0";
      letterSpan.style.transform = "translateY(30px) scale(0.8)";
      letterSpan.style.animationDelay = index * 0.05 + "s";

      letterSpan.addEventListener("mouseenter", () => {
        if (!letterSpan.classList.contains("animating")) {
          triggerLetterAnimation(letterSpan);
        }
      });
      letterSpan.addEventListener("click", () => {
        triggerLetterAnimation(letterSpan);
      });
      letterSpan.addEventListener("animationend", () => {
        letterSpan.classList.remove("animating");
        letterSpan.classList.remove(animClass);
      });
      dancingLettersElement.appendChild(letterSpan);
    }
  });

  const letterElements =
    dancingLettersElement.querySelectorAll(".dancing-letter");
  letterElements.forEach((letterEl, index) => {
    setTimeout(
      () => {
        letterEl.style.transition =
          "all 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)";
        letterEl.style.opacity = "1";
        letterEl.style.transform = "translateY(0) scale(1)";
      },
      800 + index * 40,
    );
  });
  function fitDancingLetters() {
    if (!dancingLettersElement) return;
    dancingLettersElement.style.transform = "none";
    const naturalWidth = dancingLettersElement.scrollWidth;
    if (!naturalWidth) return;
    const viewportWidth = window.innerWidth;
    const horizontalPadding = viewportWidth < 640 ? 32 : 64;
    const maxAllowed = Math.min(viewportWidth - horizontalPadding, 900);
    if (naturalWidth > maxAllowed) {
      const scale = Math.max(0.32, maxAllowed / naturalWidth);
      dancingLettersElement.style.transform = `scale(${scale})`;
    }
  }

  fitDancingLetters();

  let dancingFitResizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(dancingFitResizeTimer);
    dancingFitResizeTimer = setTimeout(fitDancingLetters, 120);
  });

  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitDancingLetters);
  }
}

function triggerLetterAnimation(letterElement) {
  const animClass = letterElement.dataset.animation;
  letterAnimations.forEach((anim) => letterElement.classList.remove(anim));
  void letterElement.offsetWidth;
  letterElement.classList.add("animating");
  letterElement.classList.add(animClass);
  setTimeout(() => {
    letterElement.classList.remove("animating");
    letterElement.classList.remove(animClass);
  }, 2000);
}

// ====== COVERFLOW CAROUSEL ======
class CoverflowCarousel {
  constructor(container, options = {}) {
    this.container = container;
    this.slides = options.slides || [];
    this.options = {
      rotate: options.rotate || 44,
      depth: options.depth || 0.6,
      falloff: options.falloff || 0.56,
      fade: options.fade || 0.1,
      gap: options.gap || 0.05,
      loop: options.loop !== false,
      showCaption: options.showCaption || false,
      showPagination: options.showPagination || false,
      showNavigation: options.showNavigation || false,
    };
    this.pos = 0;
    this.target = 0;
    this.width = 0;
    this.rafId = null;
    this.drag = null;
    this.slideElements = [];
    this.init();
  }
  init() {
    this.render();
    this.setupEventListeners();
    this.updateWidth();
    this.paint();
    window.addEventListener("resize", () => {
      this.updateWidth();
      this.paint();
    });
  }
  render() {
    const slides = this.slides;
    const { showCaption, showPagination, showNavigation } = this.options;
    this.container.innerHTML = `
                    <div class="coverflow-carousel">
                        <div class="coverflow-frame" tabindex="0">
                            <div class="coverflow-stage">
                                ${slides.map((slide, i) => `<div class="coverflow-slide" data-index="${i}"${slide.ariaLabel ? ` role="img" aria-label="${slide.ariaLabel}"` : ""}>${slide.content ? slide.content : `<img src="${slide.src}" alt="${slide.alt}" draggable="false">`}</div>`).join("")}
                            </div>
                        </div>                        
                        ${
                          showNavigation
                            ? `
                            <button class="coverflow-nav-button prev" aria-label="Previous slide"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"></polyline></svg></button>
                            <button class="coverflow-nav-button next" aria-label="Next slide"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></button>
                        `
                            : ""
                        }
                        ${showCaption ? `<div class="coverflow-caption"></div>` : ""}
                        ${showPagination ? `<div class="coverflow-pagination"></div>` : ""}
                    </div>
                `;
    this.frame = this.container.querySelector(".coverflow-frame");
    this.stage = this.container.querySelector(".coverflow-stage");
    this.slideElements = Array.from(
      this.container.querySelectorAll(".coverflow-slide"),
    );
    this.captionEl = this.container.querySelector(".coverflow-caption");
    this.paginationEl = this.container.querySelector(".coverflow-pagination");
    if (showPagination) this.renderPagination();
    if (showCaption) this.updateCaption();
  }
  setupEventListeners() {
    this.frame.addEventListener("pointerdown", this.onPointerDown.bind(this));
    this.frame.addEventListener("pointermove", this.onPointerMove.bind(this));
    this.frame.addEventListener("pointerup", this.endDrag.bind(this));
    this.frame.addEventListener("pointercancel", this.endDrag.bind(this));
    this.frame.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        this.nudge(-1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        this.nudge(1);
      }
    });
    const prevBtn = this.container.querySelector(".coverflow-nav-button.prev");
    const nextBtn = this.container.querySelector(".coverflow-nav-button.next");
    if (prevBtn) prevBtn.addEventListener("click", () => this.nudge(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => this.nudge(1));
    if (this.paginationEl) {
      this.paginationEl.addEventListener("click", (e) => {
        const dot = e.target.closest(".coverflow-dot");
        if (dot) {
          const index = parseInt(dot.dataset.index);
          this.goTo(index);
        }
      });
    }
  }
  updateWidth() {
    if (this.slideElements.length > 0)
      this.width = this.slideElements[0].offsetWidth;
  }
  indexAt(pos) {
    const count = this.slides.length;
    return ((Math.round(pos) % count) + count) % count;
  }
  clamp(pos) {
    if (this.options.loop) return pos;
    return Math.max(0, Math.min(this.slides.length - 1, pos));
  }
  paint() {
    if (!this.width) return;
    const { rotate, depth, falloff, fade, gap, loop } = this.options;
    const count = this.slides.length;
    const pitch = this.width * (1 + gap);
    const pos = this.pos;
    this.slideElements.forEach((slide, index) => {
      let offset = index - pos;
      if (loop) {
        offset = ((offset % count) + count) % count;
        if (offset > count / 2) offset -= count;
      }
      const distance = Math.abs(offset);
      const ramp = Math.pow(distance, falloff);
      const tilt = Math.min(rotate * ramp, 82) * Math.sign(offset);
      slide.style.transform =
        `translateX(calc(-50% + ${offset * pitch}px)) ` +
        `translateZ(${-depth * this.width * ramp}px) ` +
        `rotateY(${-tilt}deg)`;
      const edge = loop ? Math.min(1, Math.max(0, count / 2 - distance)) : 1;
      slide.style.opacity = Math.max(0, 1 - fade * distance) * edge;
      slide.style.zIndex = 100 - Math.round(distance);
    });
  }
  settle(target) {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
    this.target = target;
    const selectedIndex = this.indexAt(target);
    if (this.options.showCaption) this.updateCaption(selectedIndex);
    if (this.options.showPagination) this.updatePagination(selectedIndex);
    const step = () => {
      const remaining = this.target - this.pos;
      if (Math.abs(remaining) < 0.0004) {
        this.pos = this.target;
        this.paint();
        this.rafId = null;
        return;
      }
      this.pos += remaining * 0.16;
      this.paint();
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  }
  goTo(index) {
    const count = this.slides.length;
    const target = this.options.loop
      ? index + Math.round((this.target - index) / count) * count
      : index;
    this.settle(this.clamp(target));
  }
  nudge(by) {
    this.settle(this.clamp(Math.round(this.target) + by));
  }
  onPointerDown(event) {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.frame.setPointerCapture(event.pointerId);
    this.target = this.pos;
    this.drag = {
      id: event.pointerId,
      x: event.clientX,
      pos: this.pos,
      v: 0,
      t: performance.now(),
    };
  }
  onPointerMove(event) {
    if (!this.drag || this.drag.id !== event.pointerId) return;
    const pitch = this.width * (1 + this.options.gap);
    if (!pitch) return;
    const now = performance.now();
    const previous = this.pos;
    this.pos = this.clamp(
      this.drag.pos - (event.clientX - this.drag.x) / pitch,
    );
    this.drag.v =
      ((this.pos - previous) / Math.max(now - this.drag.t, 1)) * 1000;
    this.drag.t = now;
    this.paint();
  }
  endDrag(event) {
    if (!this.drag || this.drag.id !== event.pointerId) return;
    const carried = Math.max(-2, Math.min(2, this.drag.v * 0.18));
    this.drag = null;
    this.settle(this.clamp(Math.round(this.pos + carried)));
  }
  updateCaption(index) {
    if (!this.captionEl) return;
    const selectedIndex = index !== undefined ? index : this.indexAt(this.pos);
    const slide = this.slides[selectedIndex];
    if (!slide) return;

    const accent = slide.accent || "linear-gradient(135deg, #a78bfa, #ec4899)";

    const statHTML = slide.stat
      ? `
        <div class="coverflow-stat">
            <div class="coverflow-stat-top">
                <span class="coverflow-stat-value" style="background-image:${accent};">${slide.stat.value}<small>%</small></span>
                <span class="coverflow-stat-label">${slide.stat.label}</span>
            </div>
            <div class="coverflow-stat-bar">
                <span class="coverflow-stat-bar-fill" style="width:${slide.stat.value}%; background-image:${accent};"></span>
            </div>
        </div>
    `
      : "";

    const tagsHTML =
      slide.tags && slide.tags.length
        ? `
        <div class="coverflow-tag-list">
            <span class="coverflow-tag-label">Toolkit</span>
            <div class="coverflow-tag-chips">
                ${slide.tags.map((t) => `<span class="coverflow-chip">${t}</span>`).join("")}
            </div>
        </div>
    `
        : "";

    const legacyMetaHTML =
      slide.meta && slide.meta.length
        ? `
        <div class="coverflow-caption-meta">${slide.meta.map((row) => `<div class="coverflow-caption-meta-row"><span class="coverflow-caption-meta-label">${row.label}</span><span class="coverflow-caption-meta-value">${row.value}</span></div>`).join("")}</div>
    `
        : "";

    this.captionEl.innerHTML = `
        ${slide.title ? `<div class="coverflow-caption-title">${slide.title}</div>` : ""}
        ${slide.subtitle ? `<div class="coverflow-caption-subtitle">${slide.subtitle}</div>` : ""}
        ${statHTML || tagsHTML ? `<div class="coverflow-caption-details">${statHTML}${tagsHTML}</div>` : ""}
        ${legacyMetaHTML}
    `;
  }
  updatePagination(index) {
    if (!this.paginationEl) return;
    const selectedIndex = index !== undefined ? index : this.indexAt(this.pos);
    const dots = this.paginationEl.querySelectorAll(".coverflow-dot");
    dots.forEach((dot, i) =>
      dot.classList.toggle("active", i === selectedIndex),
    );
  }
  renderPagination() {
    if (!this.paginationEl) return;
    this.paginationEl.innerHTML = this.slides
      .map(
        (_, i) =>
          `<button class="coverflow-dot${i === 0 ? " active" : ""}" data-index="${i}" aria-label="Go to slide ${i + 1}"></button>`,
      )
      .join("");
  }
  destroy() {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }
}

// ====== BUILD SKILLS COVERFLOW (creative, no photos) ======
function initSkillsCoverflow() {
  const container = document.getElementById("skillsCoverflow");
  if (!container) return;

  const skillsData = [
    {
      name: "Programming Languages",
      icon: "💻",
      level: 82,
      desc: "Versatile, multi-paradigm coding across desktop, web, and game engines.",
      tags: ["JavaScript", "C++", "C#", "Java", "Python"],
      gradient: "linear-gradient(135deg, #8b5cf6, #5b21b6)",
    },
    {
      name: "Front-End & Web",
      icon: "🌐",
      level: 89,
      desc: "Responsive, accessible, and search-friendly interfaces built from scratch.",
      tags: ["HTML5", "CSS3", "Responsive Design", "SEO"],
      gradient: "linear-gradient(135deg, #ec4899, #9d174d)",
    },
    {
      name: "E-Commerce",
      icon: "🛒",
      level: 83,
      desc: "Storefront builds, theme customization, and conversion-focused content.",
      tags: ["Shopify Development", "Theme Customization", "Product Content"],
      gradient: "linear-gradient(135deg, #22d3ee, #0e7490)",
    },
    {
      name: "UI/UX Design",
      icon: "🎨",
      level: 80,
      desc: "Designing and auditing interfaces that feel as good as they look.",
      tags: ["Figma", "UX Auditing", "Wireframing", "Prototyping"],
      gradient: "linear-gradient(135deg, #fb923c, #9a3412)",
    },
    {
      name: "Game & Interactive",
      icon: "🎮",
      level: 82,
      desc: "Playable prototypes and immersive worlds across two engines.",
      tags: ["Unity", "Unreal Engine", "VR Development", "AR Research"],
      gradient: "linear-gradient(135deg, #8b5cf6, #ec4899)",
    },
    {
      name: "CS & Analysis",
      icon: "🧠",
      level: 83,
      desc: "Strong computer science foundations and research-driven thinking.",
      tags: ["Git", "OOP", "Data Structures", "AI Code Evaluation"],
      gradient: "linear-gradient(135deg, #22d3ee, #6d28d9)",
    },
  ];

  const slides = skillsData.map((skill) => ({
    ariaLabel: `${skill.name} — ${skill.level}% proficiency`,
    title: skill.name,
    subtitle: skill.desc,
    accent: skill.gradient,
    stat: { label: "Proficiency", value: skill.level },
    tags: skill.tags.slice(0, 3),
    content: `
        <div class="skill-slide-inner" style="background:${skill.gradient}">
            <div class="skill-slide-icon" aria-hidden="true">${skill.icon}</div>
            <div class="skill-slide-name">${skill.name}</div>
            <div class="skill-slide-minibar">
                <div class="skill-slide-minibar-fill" style="width:${skill.level}%"></div>
            </div>
            <div class="skill-slide-level">${skill.level}%</div>
        </div>
    `,
  }));

  new CoverflowCarousel(container, {
    slides,
    showCaption: true,
    showNavigation: true,
    showPagination: true,
    loop: true,
  });
}
setTimeout(initSkillsCoverflow, 400);

console.log("🚀 Beshoy Aziz portfolio ready!");

// ====== PROJECT DETAILS MODAL — controller ======
const modalOverlay = document.getElementById("projectModalOverlay");
const modalPanel = document.getElementById("projectModal");
const modalCloseBtn = document.getElementById("projectModalClose");
const modalImage = document.getElementById("projectModalImage");
const modalIndex = document.getElementById("projectModalIndex");
const modalCategory = document.getElementById("projectModalCategory");
const modalTitle = document.getElementById("projectModalTitle");
const modalDesc = document.getElementById("projectModalDesc");
const modalTags = document.getElementById("projectModalTags");
const modalGithub = document.getElementById("projectModalGithub");
const modalVideo = document.getElementById("projectModalVideo");
const modalLive = document.getElementById("projectModalLive");

let projectModalOpen = false;
let lastFocusedEl = null;

function openProjectModal(data, triggerEl) {
  if (!modalOverlay) return;
  lastFocusedEl = triggerEl || document.activeElement;

  modalImage.src = data.src;
  modalImage.alt = data.alt || data.title || "";
  modalIndex.textContent = data.indexLabel || "";
  modalCategory.textContent = data.category || "";
  modalTitle.textContent = data.title || "";
  modalDesc.textContent = data.desc || "";
  modalTags.innerHTML = (data.tags || [])
    .map((t) => `<span class="project-modal-tag">${t}</span>`)
    .join("");

  // Live site button
  if (data.live) {
    modalLive.href = data.live;
    modalLive.style.display = "inline-flex";
  } else {
    modalLive.style.display = "none";
  }

  // GitHub button
  if (data.github) {
    modalGithub.href = data.github;
    modalGithub.style.display = "inline-flex";
  } else {
    modalGithub.style.display = "none";
  }

  // Video demo button
  if (data.video) {
    modalVideo.href = data.video;
    modalVideo.style.display = "inline-flex";
  } else {
    modalVideo.style.display = "none";
  }

  modalOverlay.classList.add("open");
  modalOverlay.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  projectModalOpen = true;

  if (window.gsap) {
    gsap.killTweensOf(modalPanel);
    gsap.fromTo(
      modalPanel,
      { scale: 0.88, y: 40, opacity: 0 },
      { scale: 1, y: 0, opacity: 1, duration: 0.55, ease: "back.out(1.6)" },
    );
  } else {
    modalPanel.style.opacity = "1";
    modalPanel.style.transform = "scale(1) translateY(0)";
  }

  setTimeout(() => modalCloseBtn && modalCloseBtn.focus(), 60);
}

function closeProjectModal() {
  if (!modalOverlay || !projectModalOpen) return;
  const finish = () => {
    modalOverlay.classList.remove("open");
    modalOverlay.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    projectModalOpen = false;
    if (lastFocusedEl && typeof lastFocusedEl.focus === "function")
      lastFocusedEl.focus();
  };

  if (window.gsap) {
    gsap.to(modalPanel, {
      scale: 0.92,
      y: 20,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: finish,
    });
  } else {
    finish();
  }
}

if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeProjectModal);
if (modalOverlay) {
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeProjectModal();
  });
}
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && projectModalOpen) closeProjectModal();
});

// ====== STACK SPREAD — Vanilla GSAP port ======
(function initStackSpread() {
  const section = document.getElementById("projects");
  const copyEl = document.getElementById("stack-spread-copy");
  const cardsEl = document.getElementById("stack-spread-cards");
  const hintEl = document.getElementById("stack-spread-hint");
  if (!section || !copyEl || !cardsEl || !hintEl) return;

  // ── Card data (your project images + Unsplash fills) ──
  const CARDS = [
    {
      src: "Images/Portfolio.png",
      alt: "Portfolio Website",
      stackOX: -10,
      stackOY: -10,
      stackRotate: -16,
      endX: -20,
      endY: -40,
      endRotate: 0,
      endSmX: -22,
      endSmY: -42,
      w: 18,
      h: 23,
      z: 2,
      scale: 0.85,
      project: {
        title: "Portfolio Website",
        category: "Web Development",
        desc: "A creative portfolio website with advanced animations and interactive elements.",
        tags: ["HTML", "CSS", "JavaScript"],
        live: "https://beshoyaziz7.github.io/Beshoy-Portfolio/",
        github: "https://github.com/BeshoyAziz7/Beshoy-Portfolio",
      },
    },
    {
      src: "Images/UNREAL.png",
      alt: "Unreal Engine Game",
      stackOX: 12,
      stackOY: -12,
      stackRotate: 18,
      endX: 27,
      endY: -36,
      endRotate: 0,
      endSmX: 22,
      endSmY: -42,
      w: 19,
      h: 25,
      z: 3,
      scale: 0.88,
      project: {
        title: "Unreal Engine Game Project",
        category: "Game Development",
        desc: "An immersive 3D environment and game prototype developed in Unreal Engine, showcasing level design and interactive elements.",
        tags: ["Unreal Engine", "Blueprints", "Level Design"],
        video: "https://jmp.sh/KaTlmM1a",
      },
    },
    {
      src: "Images/MEMORY.png",
      alt: "Memory Game",
      stackOX: -20,
      stackOY: 2,
      stackRotate: -5,
      endX: -44,
      endY: -8,
      endRotate: 0,
      endSmX: -22,
      endSmY: -14,
      w: 16,
      h: 26,
      z: 4,
      scale: 0.85,
      project: {
        title: "Memory Game",
        category: "C# / Windows Forms",
        desc: "A classic memory game developed using Windows Forms, showcasing interactive UI and game logic.",
        tags: ["C#", ".NET Framework", "Windows Forms"],
        video: "https://jmp.sh/kRCQOKMf",
        github: "https://github.com/BeshoyAziz7/FinalProject-MemoryGame-",
      },
    },
    {
      src: "Images/VR.png",
      alt: "VR Game Project",
      stackOX: 1,
      stackOY: -4,
      stackRotate: -2,
      endX: 44,
      endY: -6,
      endRotate: 0,
      endSmX: 22,
      endSmY: -14,
      w: 21,
      h: 26,
      z: 5,
      scale: 0.85,
      project: {
        title: "VR Simple Game Project",
        category: "VR Development",
        desc: "A basic Virtual Reality game developed using Unity and C#, demonstrating fundamental VR mechanics.",
        tags: ["Unity", "C#", "VR Development"],
        video: "https://jmp.sh/ysOER0eL",
        github: "https://github.com/BeshoyAziz7/VR-Simple-Game-Project",
      },
    },
    {
      src: "Images/Unity.jpg",
      alt: "Unity Survival Game",
      stackOX: -12,
      stackOY: 14,
      stackRotate: 7,
      endX: -36,
      endY: 22,
      endRotate: 0,
      endSmX: -22,
      endSmY: 18,
      w: 19,
      h: 24,
      z: 6,
      scale: 0.85,
      project: {
        title: "Simple Unity Survival Game",
        category: "Game Development",
        desc: "A survival game prototype developed in Unity, featuring core mechanics like resource gathering, crafting, and basic combat.",
        tags: ["Unity", "C#", "Game Design"],
        video: "https://jmp.sh/gkL6tjwg",
        github: "https://github.com/BeshoyAziz7/Simple-Unity-Survival-Game",
      },
    },
    {
      src: "Images/Quizzer.png",
      alt: "A&N Quizzery",
      stackOX: 18,
      stackOY: 16,
      stackRotate: 4,
      endX: 10,
      endY: 38,
      endRotate: 0,
      endSmX: -22,
      endSmY: 46,
      w: 18,
      h: 25,
      z: 7,
      scale: 0.85,
      project: {
        title: "A&N Quizzery",
        category: "Web Application",
        desc: "An interactive quiz web application designed to test knowledge on various topics with real-time feedback.",
        tags: ["HTML", "CSS", "JavaScript", "Firebase"],
        live: "https://beshoyaziz7.github.io/A-NQuizzery/",
        github: "https://github.com/BeshoyAziz7/A-NQuizzery",
      },
    },
    {
      src: "Images/WebsitePortfolio.png",
      alt: "New Project",
      stackOX: 6,
      stackOY: 20,
      stackRotate: -8,
      endX: 40,
      endY: 30,
      endRotate: 0,
      endSmX: 22,
      endSmY: 46,
      w: 19,
      h: 24,
      z: 8,
      scale: 0.85,
      project: {
        title: "New Project Title",
        category: "Category Here",
        desc: "Description of the new project goes here.",
        tags: ["Tag One", "Tag Two", "Tag Three"],
        live: "",
        github: "",
        video: "",
      },
    },
  ];

  const isTouch = window.matchMedia("(pointer: coarse)").matches;
  const noMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const STACK_SCALE = 0.82;
  const SCATTER_START = 0.12;
  const SCATTER_END = 1.0;
  const TEXT_FADE_START = 0.3;

  // ── Build card DOM ──
  let projectCounter = 0;
  const cardEls = CARDS.map((card) => {
    const div = document.createElement("div");
    div.className = "ss-card";
    if (!isTouch) {
      div.style.width = card.w + "vw";
      div.style.height = card.h + "vh";
    }
    div.style.zIndex = String(card.z);
    div.style.transform =
      `translate(calc(-50% + ${card.stackOX}vw), calc(-50% + ${card.stackOY}vh))` +
      ` rotate(${card.stackRotate}deg)` +
      ` scale(${STACK_SCALE})`;

    const img = document.createElement("img");
    img.src = card.src;
    img.alt = card.alt;
    img.loading = "lazy";
    img.draggable = false;
    div.appendChild(img);

    if (card.project) {
      projectCounter += 1;
      div.classList.add("ss-card-clickable");
      div.setAttribute("role", "button");
      div.setAttribute("tabindex", "0");
      div.setAttribute("aria-label", `View details for ${card.project.title}`);

      const overlay = document.createElement("div");
      overlay.className = "ss-card-hover-overlay";
      overlay.innerHTML = `<span class="ss-card-hover-label">View Project <span aria-hidden="true">→</span></span>`;
      div.appendChild(overlay);

      const openHandler = () =>
        openProjectModal(
          {
            src: card.src,
            alt: card.alt,
            title: card.project.title,
            category: card.project.category,
            desc: card.project.desc,
            tags: card.project.tags,
            live: card.project.live,
            github: card.project.github,
            video: card.project.video,
            indexLabel: String(projectCounter).padStart(2, "0"),
          },
          div,
        );

      div.addEventListener("click", openHandler);
      div.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openHandler();
        }
      });
    }

    cardsEl.appendChild(div);
    return div;
  });

  // ── ScrollTrigger scrub ──
  ScrollTrigger.create({
    trigger: section,
    start: "top top",
    end: "bottom bottom",
    scrub: 1,
    onUpdate(self) {
      const raw = self.progress;

      // Scatter progress 0→1
      let p;
      if (raw <= SCATTER_START) p = 0;
      else if (raw >= SCATTER_END) p = 1;
      else p = (raw - SCATTER_START) / (SCATTER_END - SCATTER_START);

      // Cards
      CARDS.forEach((card, i) => {
        const el = cardEls[i];
        const endX = isTouch ? Math.sign(card.endSmX) * 22 : card.endX;
        const endY = isTouch ? card.endSmY : card.endY;
        const endR = isTouch ? 0 : card.endRotate;
        const endS = isTouch ? 0.72 : card.scale;

        const tx = card.stackOX + (endX - card.stackOX) * p;
        const ty = card.stackOY + (endY - card.stackOY) * p;
        const tr = card.stackRotate + (endR - card.stackRotate) * p;
        const ts = STACK_SCALE + (endS - STACK_SCALE) * p;

        el.style.transform =
          `translate(calc(-50% + ${tx}vw), calc(-50% + ${ty}vh))` +
          ` rotate(${tr}deg)` +
          ` scale(${ts})`;
      });

      // Centre copy
      const textP = Math.max(0, Math.min(1, (p - TEXT_FADE_START) / 0.3));
      copyEl.style.opacity = String(textP);
      copyEl.style.transform = `scale(${0.85 + 0.15 * Math.min(p / 0.9, 1)})`;

      // Scroll hint
      const hintP = Math.max(0, 1 - raw / SCATTER_START);
      hintEl.style.opacity = String(hintP);
    },
  });

  // ── Pointer parallax (desktop, non-reduced motion, after full scatter) ──
  if (!isTouch && !noMotion) {
    const PARALLAX_X = 2.6;
    const PARALLAX_Y = 2.2;
    let isSpread = false;
    let pointerX = 0,
      pointerY = 0;
    let smoothX = 0,
      smoothY = 0;
    const total = CARDS.length;

    ScrollTrigger.create({
      trigger: section,
      start: "top top",
      end: "bottom bottom",
      onUpdate(self) {
        const raw = self.progress;
        let p;
        if (raw <= SCATTER_START) p = 0;
        else if (raw >= SCATTER_END) p = 1;
        else p = (raw - SCATTER_START) / (SCATTER_END - SCATTER_START);
        isSpread = p >= 0.999;
      },
    });

    window.addEventListener(
      "pointermove",
      (e) => {
        if (!isSpread) return;
        pointerX = (e.clientX / window.innerWidth) * 2 - 1;
        pointerY = (e.clientY / window.innerHeight) * 2 - 1;
      },
      { passive: true },
    );

    document.addEventListener("pointerleave", () => {
      pointerX = 0;
      pointerY = 0;
    });

    function depth(i) {
      return total <= 1 ? 1 : 0.55 + (i / (total - 1)) * 0.75;
    }

    (function rafLoop() {
      smoothX += (pointerX - smoothX) * 0.085;
      smoothY += (pointerY - smoothY) * 0.085;

      if (
        isSpread &&
        (Math.abs(smoothX) > 0.0005 || Math.abs(smoothY) > 0.0005)
      ) {
        CARDS.forEach((card, i) => {
          const dx = card.endX - smoothX * PARALLAX_X * depth(i);
          const dy = card.endY - smoothY * PARALLAX_Y * depth(i);
          cardEls[i].style.transform =
            `translate(calc(-50% + ${dx}vw), calc(-50% + ${dy}vh))` +
            ` rotate(${card.endRotate}deg)` +
            ` scale(${card.scale})`;
        });
      }
      requestAnimationFrame(rafLoop);
    })();
  }

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();

// ====== MOTION FOOTER — GSAP + ScrollTrigger + Magnetic Buttons ======
(function initMotionFooter() {
  // ── 1. Register ScrollTrigger ──
  gsap.registerPlugin(ScrollTrigger);

  // ── 2. Build Marquee Content ──
  const footerMarqueeTrack = document.getElementById("footerMarqueeTrack");
  if (footerMarqueeTrack) {
    const items = [
      "Web Developer",
      "UI/UX Designer",
      "Game Designer",
      "VR / AR Developer",
      "Creative Coder",
    ];

    // Build one set of items
    function buildMarqueeSet() {
      return items
        .map((label, i) => {
          const dotColor = i % 2 === 0 ? "var(--primary)" : "var(--secondary)";
          return `
                            <span class="footer-marquee-item">
                                <span>${label}</span>
                                <span class="fmi-dot" style="color:${dotColor};">✦</span>
                            </span>
                        `;
        })
        .join("");
    }

    // Two identical sets for seamless loop
    footerMarqueeTrack.innerHTML = buildMarqueeSet() + buildMarqueeSet();
  }

  // ── 3. GSAP ScrollTrigger Animations ──
  const curtain = document.getElementById("footer-curtain");
  const giantText = document.getElementById("footer-giant-text");
  const heading = document.getElementById("footer-heading");
  const links = document.getElementById("footer-links");

  if (curtain && giantText) {
    // Giant background text parallax
    gsap.fromTo(
      giantText,
      { y: "10vh", scale: 0.8, opacity: 0 },
      {
        y: "0vh",
        scale: 1,
        opacity: 1,
        ease: "power1.out",
        scrollTrigger: {
          trigger: curtain,
          start: "top 80%",
          end: "bottom bottom",
          scrub: 1,
        },
      },
    );
  }

  if (curtain && heading && links) {
    // Heading + links staggered reveal
    gsap.fromTo(
      [heading, links],
      { y: 50, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.15,
        ease: "power3.out",
        scrollTrigger: {
          trigger: curtain,
          start: "top 40%",
          end: "bottom bottom",
          scrub: 1,
        },
      },
    );
  }

  // ── 4. Magnetic Button Effect ──
  // Uses the same GSAP approach as the React original
  function initFooterMagneticButtons() {
    const buttons = document.querySelectorAll(".footer-magnetic");

    buttons.forEach((btn) => {
      btn.addEventListener("mousemove", function (e) {
        const rect = btn.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;

        gsap.to(btn, {
          x: x * 0.4,
          y: y * 0.4,
          rotationX: -y * 0.15,
          rotationY: x * 0.15,
          scale: 1.05,
          ease: "power2.out",
          duration: 0.4,
        });
      });

      btn.addEventListener("mouseleave", function () {
        gsap.to(btn, {
          x: 0,
          y: 0,
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          ease: "elastic.out(1, 0.3)",
          duration: 1.2,
        });
      });
    });
  }

  initFooterMagneticButtons();

  // ── 5. Refresh ScrollTrigger after full page load ──
  // (important because images may shift layout after load)
  window.addEventListener("load", () => {
    ScrollTrigger.refresh();
  });
})();
