const header = document.querySelector("[data-header]");
const nav = document.querySelector("#site-nav");
const toggle = document.querySelector(".nav-toggle");
const contactForm = document.querySelector("[data-contact-form]");
const formStatus = document.querySelector("[data-form-status]");
const liveValue = document.querySelector("[data-live-value]");
const loopValue = document.querySelector("[data-loop-value]");
const syncValue = document.querySelector("[data-sync-value]");
const hero = document.querySelector(".hero");
const heroVisual = document.querySelector(".hero-visual");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const missionTabs = document.querySelectorAll("[data-mission]");
const missionLabel = document.querySelector("[data-mission-label]");
const missionText = document.querySelector("[data-mission-text]");
const missionDisplay = document.querySelector(".mission-display");
const particleCanvas = document.querySelector("[data-particle-field]");
const magneticElements = document.querySelectorAll("[data-magnetic]");

const missionContent = {
  innovate: {
    label: "Innovate",
    text: "Explore bold ideas through fast experiments, technical discovery, and proof-of-concept builds that reveal what is possible."
  },
  design: {
    label: "Design",
    text: "Shape electronics, interfaces, circuits, and learning experiences with a product-minded eye for clarity, durability, and beauty."
  },
  develop: {
    label: "Develop",
    text: "Build the firmware, sensor loops, AI pipelines, and validation habits that turn a concept into a reliable working system."
  },
  educate: {
    label: "Educate",
    text: "Teach practical engineering through hands-on labs, real hardware, and explanations that make complex systems feel buildable."
  }
};

const closeNav = () => {
  if (!nav || !toggle) {
    return;
  }

  nav.classList.remove("is-open");
  document.body.classList.remove("nav-open");
  toggle.classList.remove("is-open");
  toggle.setAttribute("aria-expanded", "false");
};

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("is-open");
    document.body.classList.toggle("nav-open", isOpen);
    toggle.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      closeNav();
    }
  });
}

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeNav();
  }
});

const syncHeader = () => {
  header?.classList.toggle("is-scrolled", window.scrollY > 8);
};

syncHeader();
window.addEventListener("scroll", syncHeader, { passive: true });

const readings = [
  ["38.2k", "1.8ms", "99.4%"],
  ["41.7k", "2.1ms", "99.1%"],
  ["36.9k", "1.6ms", "99.7%"],
  ["44.3k", "1.9ms", "99.3%"]
];

let readingIndex = 0;

const syncReadouts = () => {
  if (!liveValue || !loopValue || !syncValue) {
    return;
  }

  readingIndex = (readingIndex + 1) % readings.length;
  const [live, loop, sync] = readings[readingIndex];
  liveValue.textContent = live;
  loopValue.textContent = loop;
  syncValue.textContent = sync;
};

if (!reducedMotion.matches) {
  window.setInterval(syncReadouts, 2200);

  window.addEventListener("pointermove", (event) => {
    document.documentElement.style.setProperty("--cursor-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--cursor-y", `${event.clientY}px`);
  }, { passive: true });
}

const initParticleField = () => {
  if (!particleCanvas || reducedMotion.matches) {
    return;
  }

  const context = particleCanvas.getContext("2d");
  if (!context) {
    return;
  }

  let width = 0;
  let height = 0;
  let animationFrame = 0;
  const pointer = { x: 0, y: 0, active: false };
  const particles = [];

  const resize = () => {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const rect = particleCanvas.getBoundingClientRect();
    width = rect.width;
    height = rect.height;
    particleCanvas.width = Math.max(1, Math.floor(width * ratio));
    particleCanvas.height = Math.max(1, Math.floor(height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);

    particles.length = 0;
    const count = Math.min(86, Math.max(42, Math.floor(width / 18)));
    for (let index = 0; index < count; index += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.6 + 0.7,
        hue: Math.random() > 0.5 ? 184 : 212
      });
    }
  };

  const draw = () => {
    context.clearRect(0, 0, width, height);
    context.globalCompositeOperation = "lighter";

    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;

      if (particle.x < -20) particle.x = width + 20;
      if (particle.x > width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;

      if (pointer.active) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 150 && distance > 0) {
          const force = (150 - distance) / 150;
          particle.x += (dx / distance) * force * 0.65;
          particle.y += (dy / distance) * force * 0.65;
        }
      }

      for (let next = index + 1; next < particles.length; next += 1) {
        const other = particles[next];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 112) {
          const alpha = (1 - distance / 112) * 0.28;
          context.strokeStyle = `hsla(${particle.hue}, 100%, 62%, ${alpha})`;
          context.lineWidth = 1;
          context.beginPath();
          context.moveTo(particle.x, particle.y);
          context.lineTo(other.x, other.y);
          context.stroke();
        }
      }

      context.fillStyle = `hsla(${particle.hue}, 100%, 65%, 0.72)`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    });

    animationFrame = window.requestAnimationFrame(draw);
  };

  window.addEventListener("pointermove", (event) => {
    const rect = particleCanvas.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = pointer.x >= 0 && pointer.x <= rect.width && pointer.y >= 0 && pointer.y <= rect.height;
  }, { passive: true });

  window.addEventListener("resize", resize);
  resize();
  draw();

  reducedMotion.addEventListener?.("change", () => {
    window.cancelAnimationFrame(animationFrame);
    context.clearRect(0, 0, width, height);
  });
};

const revealTargets = document.querySelectorAll([
  ".intro-grid",
  ".stat-strip > div",
  ".mission-logo-panel",
  ".mission-content",
  ".mission-console",
  ".mission-values article",
  ".founder-card",
  ".founder-copy",
  ".founder-stats span",
  ".section-heading",
  ".service-card",
  ".track",
  ".tutorial-link",
  ".learning-visual",
  ".innovation-panel",
  ".wall-module",
  ".contact-signal",
  ".contact-details",
  ".contact-form"
].join(","));

if (revealTargets.length) {
  revealTargets.forEach((element, index) => {
    element.classList.add("revealable");
    element.style.setProperty("--reveal-delay", `${(index % 6) * 70}ms`);
  });

  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    revealTargets.forEach((element) => element.classList.add("is-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return;
        }

        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, {
      rootMargin: "0px 0px -8% 0px",
      threshold: 0.14
    });

    revealTargets.forEach((element) => revealObserver.observe(element));
  }
}

if (magneticElements.length && !reducedMotion.matches) {
  magneticElements.forEach((element) => {
    element.addEventListener("pointermove", (event) => {
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width - 0.5) * 18;
      const y = ((event.clientY - rect.top) / rect.height - 0.5) * 18;
      element.style.setProperty("--magnetic-x", `${x.toFixed(2)}px`);
      element.style.setProperty("--magnetic-y", `${y.toFixed(2)}px`);
    });

    element.addEventListener("pointerleave", () => {
      element.style.setProperty("--magnetic-x", "0px");
      element.style.setProperty("--magnetic-y", "0px");
    });
  });
}

initParticleField();

if (missionTabs.length && missionLabel && missionText) {
  missionTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const nextMission = missionContent[tab.dataset.mission];
      if (!nextMission) {
        return;
      }

      missionTabs.forEach((item) => {
        const isActive = item === tab;
        item.classList.toggle("is-active", isActive);
        item.setAttribute("aria-selected", String(isActive));
      });

      missionLabel.textContent = nextMission.label;
      missionText.textContent = nextMission.text;

      if (missionDisplay && !reducedMotion.matches) {
        missionDisplay.classList.remove("is-switching");
        window.requestAnimationFrame(() => {
          missionDisplay.classList.add("is-switching");
        });
      }
    });
  });
}

if (hero && heroVisual && !reducedMotion.matches) {
  hero.addEventListener("pointermove", (event) => {
    const rect = heroVisual.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      return;
    }

    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;

    document.documentElement.style.setProperty("--tilt-y", `${(x * 8).toFixed(2)}deg`);
    document.documentElement.style.setProperty("--tilt-x", `${(-y * 6).toFixed(2)}deg`);
  });

  hero.addEventListener("pointerleave", () => {
    document.documentElement.style.setProperty("--tilt-y", "0deg");
    document.documentElement.style.setProperty("--tilt-x", "0deg");
  });
}

if (contactForm && formStatus) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const name = formData.get("name")?.toString().trim() || "there";
    const email = formData.get("email")?.toString().trim() || "";
    const type = formData.get("type")?.toString().trim() || "General inquiry";
    const message = formData.get("message")?.toString().trim() || "";
    const subject = encodeURIComponent(`Bitronix Lab inquiry: ${type}`);
    const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\nProject type: ${type}\n\n${message}`);

    window.location.href = `mailto:hello@bitronixlab.com?subject=${subject}&body=${body}`;
    formStatus.textContent = `Thanks, ${name}. Opening your email app now.`;
    contactForm.reset();
  });
}


/* === Bitronix Lab — extra animations === */

/* Typewriter for hero subtitle */
(() => {
  const target = document.querySelector("[data-typewriter]");
  if (!target) return;
  let words;
  try { words = JSON.parse(target.dataset.words || "[]"); }
  catch { words = []; }
  if (!words.length || reducedMotion.matches) return;

  let wordIndex = 0;
  let charIndex = words[0].length;
  let deleting = false;

  const tick = () => {
    const word = words[wordIndex];
    if (!deleting) {
      charIndex += 1;
      target.textContent = word.slice(0, charIndex);
      if (charIndex >= word.length) {
        deleting = true;
        return setTimeout(tick, 1600);
      }
      return setTimeout(tick, 70 + Math.random() * 40);
    }
    charIndex -= 1;
    target.textContent = word.slice(0, charIndex);
    if (charIndex <= 0) {
      deleting = false;
      wordIndex = (wordIndex + 1) % words.length;
      return setTimeout(tick, 220);
    }
    setTimeout(tick, 32);
  };
  setTimeout(tick, 900);
})();

/* Reveal on scroll for new sections */
(() => {
  const items = document.querySelectorAll(".reveal-up");
  if (!items.length) return;
  if (reducedMotion.matches || !("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const io = new IntersectionObserver((entries, obs) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  items.forEach((el) => io.observe(el));
})();

/* Topic card pointer spotlight */
(() => {
  const cards = document.querySelectorAll(".topic-card");
  if (!cards.length || reducedMotion.matches) return;
  cards.forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty("--mx", `${x}%`);
      card.style.setProperty("--my", `${y}%`);
    });
  });
})();


/* === Bitronix Lab � extra animations === */
