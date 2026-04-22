/* =================================================================
   EmbeddedSys — Shared site script
   Provides:
     • Topic registry (single source of truth for the 12 subtopics)
     • Theme toggle (persisted in localStorage)
     • Scroll-reveal observer
     • Hero circuit canvas (only runs if #circuit-canvas is present)
     • Counter animation (.counter)
     • Command palette (Ctrl/⌘+K)
     • Email capture form (Option A: localStorage only)
     • Related-topics & footer renderer for subpages
     • View Transitions API for in-site navigation
     • Toast notifications
   ================================================================= */
(function () {
  'use strict';

  /* ───────── Topic registry — used by home grid, subpages,
              command palette, and related links. ───────── */
  const TOPICS = [
    { slug: 'mcu',            icon: '🧠', color: '#00d2ff', name: 'Microcontroller (MCU)',     short: 'CPU + memory + peripherals on one chip', read: 5 },
    { slug: 'rtos',           icon: '⏱️', color: '#7ee787', name: 'Real-Time OS (RTOS)',       short: 'Deterministic task scheduling',           read: 6 },
    { slug: 'interrupts',     icon: '⚡', color: '#ff7b72', name: 'Interrupts & ISR',          short: 'Hardware-driven control flow',            read: 5 },
    { slug: 'memory',         icon: '💾', color: '#d2a8ff', name: 'Memory Architecture',       short: 'Flash, SRAM, EEPROM, stack & heap',       read: 6 },
    { slug: 'dma',            icon: '🔄', color: '#ffa657', name: 'DMA',                       short: 'Move data without bothering the CPU',     read: 5 },
    { slug: 'timers-pwm',     icon: '🕑', color: '#00d2ff', name: 'Timers & PWM',              short: 'Precision time, frequency, motor control', read: 6 },
    { slug: 'protocols',      icon: '📡', color: '#7ee787', name: 'Communication Protocols',   short: 'UART, SPI, I²C, CAN — wired serial buses', read: 7 },
    { slug: 'power',          icon: '🔋', color: '#ff7b72', name: 'Power Management',          short: 'Sleep modes, microamps, battery life',     read: 5 },
    { slug: 'watchdog',       icon: '🛡️', color: '#d2a8ff', name: 'Watchdog Timer (WDT)',      short: 'Last line of defence vs. firmware hangs',  read: 4 },
    { slug: 'bootloader',     icon: '🔧', color: '#ffa657', name: 'Bootloader',                short: 'Firmware updates & secure boot',           read: 5 },
    { slug: 'adc-dac',        icon: '📊', color: '#00d2ff', name: 'ADC / DAC',                 short: 'Bridging the analogue and digital worlds', read: 6 },
    { slug: 'debugging-jtag', icon: '🔍', color: '#7ee787', name: 'Debugging & JTAG',          short: 'JTAG, SWD, and step-through debugging',    read: 5 },
  ];

  // Expose for inline scripts on topic pages.
  window.EMBEDDED_TOPICS = TOPICS;

  /* ───────── Helpers ───────── */
  const $  = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Resolve a relative path that works from both root and /topics/ pages.
  function resolvePath(p) {
    // pages live under /topics/* — detect by current path.
    const inTopics = /\/topics\//.test(location.pathname);
    if (p.startsWith('/')) return p;          // already absolute
    if (p.startsWith('http')) return p;
    return inTopics ? '../' + p : p;
  }
  window.resolveSitePath = resolvePath;

  /* ───────── Theme toggle (persisted) ───────── */
  function initTheme() {
    const btn = $('#theme-btn');
    const stored = localStorage.getItem('embsys-theme');
    let isDark = stored ? stored === 'dark' : true;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    if (btn) {
      btn.textContent = isDark ? '🌙 Dark' : '☀️ Light';
      btn.addEventListener('click', () => {
        isDark = !isDark;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        btn.textContent = isDark ? '🌙 Dark' : '☀️ Light';
        localStorage.setItem('embsys-theme', isDark ? 'dark' : 'light');
      });
    }
  }

  /* ───────── Scroll reveal ───────── */
  function initReveal() {
    if (!('IntersectionObserver' in window)) {
      $$('.reveal').forEach(el => el.classList.add('visible'));
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          obs.unobserve(e.target);
        }
      });
    }, { threshold: .12, rootMargin: '0px 0px -40px 0px' });
    $$('.reveal').forEach(el => obs.observe(el));
  }

  /* ───────── Circuit board canvas (only if present) ───────── */
  function initCircuitCanvas() {
    const canvas = $('#circuit-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W, H, nodes, tick = 0, rafId;

    function resize() {
      W = canvas.width  = canvas.offsetWidth;
      H = canvas.height = canvas.offsetHeight;
      init();
    }
    function init() {
      nodes = [];
      const cols = Math.ceil(W / 60), rows = Math.ceil(H / 60);
      for (let r = 0; r <= rows; r++) {
        for (let c = 0; c <= cols; c++) {
          nodes.push({
            x: c * 60 + (Math.random() - .5) * 20,
            y: r * 60 + (Math.random() - .5) * 20,
            connected: Math.random() > .4
          });
        }
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      const isDk = document.documentElement.getAttribute('data-theme') !== 'light';
      const lineColor = isDk ? '0,210,255' : '0,100,200';
      const dotColor  = isDk ? '126,231,135' : '30,130,80';
      tick++;

      ctx.strokeStyle = `rgba(${lineColor},.25)`;
      ctx.lineWidth = .8;
      nodes.forEach((n, i) => {
        if (!n.connected) return;
        nodes.slice(i + 1).forEach(m => {
          const d = Math.hypot(n.x - m.x, n.y - m.y);
          if (d < 90 && m.connected) {
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            const mid = (i % 2) ? { x: n.x, y: m.y } : { x: m.x, y: n.y };
            ctx.lineTo(mid.x, mid.y);
            ctx.lineTo(m.x, m.y);
            ctx.stroke();
          }
        });
      });

      nodes.forEach((n, i) => {
        if (!n.connected) return;
        const pulse = Math.sin(tick * .02 + i * .5) > .8;
        ctx.beginPath();
        ctx.arc(n.x, n.y, pulse ? 4 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = pulse ? `rgba(${lineColor},1)` : `rgba(${dotColor},.6)`;
        ctx.fill();
      });

      const signalIdx = (Math.floor(tick / 2)) % nodes.length;
      const sn = nodes[signalIdx];
      if (sn) {
        ctx.beginPath();
        ctx.arc(sn.x, sn.y, 6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${lineColor},.9)`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sn.x, sn.y, 10, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${lineColor},.3)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
      rafId = requestAnimationFrame(draw);
    }
    window.addEventListener('resize', resize);
    resize();
    if (prefersReducedMotion) {
      // Draw one static frame.
      draw();
      cancelAnimationFrame(rafId);
    } else {
      draw();
    }
  }

  /* ───────── Counters ───────── */
  function initCounters() {
    const counters = $$('.counter');
    if (!counters.length) return;
    const animate = () => {
      counters.forEach(el => {
        const target = +el.dataset.target;
        let current = 0;
        const step = Math.max(1, Math.ceil(target / 30));
        const t = setInterval(() => {
          current = Math.min(current + step, target);
          el.textContent = current;
          if (current >= target) clearInterval(t);
        }, 40);
      });
    };
    const hero = $('#hero');
    if (hero && 'IntersectionObserver' in window) {
      const o = new IntersectionObserver((es) => {
        if (es[0].isIntersecting) { animate(); o.disconnect(); }
      }, { threshold: .3 });
      o.observe(hero);
    } else {
      animate();
    }
  }

  /* ───────── Command palette ───────── */
  function initCmdK() {
    // Inject markup once.
    if ($('.cmdk-backdrop')) return;
    const back = document.createElement('div');
    back.className = 'cmdk-backdrop';
    back.setAttribute('role', 'dialog');
    back.setAttribute('aria-modal', 'true');
    back.innerHTML = `
      <div class="cmdk" role="combobox" aria-expanded="true" aria-haspopup="listbox">
        <input type="text" placeholder="Jump to a topic… (try: rtos, dma, i²c)" aria-label="Search topics" autocomplete="off">
        <ul class="cmdk-list" role="listbox"></ul>
        <div class="cmdk-foot">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>`;
    document.body.appendChild(back);

    const input = $('input', back);
    const list  = $('.cmdk-list', back);
    let activeIdx = 0, filtered = TOPICS.slice();

    function render() {
      list.innerHTML = '';
      if (!filtered.length) {
        const li = document.createElement('li');
        li.className = 'cmdk-empty';
        li.textContent = 'No matching topics';
        list.appendChild(li);
        return;
      }
      filtered.forEach((t, i) => {
        const a = document.createElement('a');
        a.className = 'cmdk-item' + (i === activeIdx ? ' active' : '');
        a.href = resolvePath('topics/' + t.slug + '.html');
        a.setAttribute('role', 'option');
        a.innerHTML = `
          <span class="ic" style="color:${t.color}">${t.icon}</span>
          <span class="meta">
            <span class="t">${t.name}</span>
            <span class="d">${t.short}</span>
          </span>`;
        a.addEventListener('mouseenter', () => { activeIdx = i; updateActive(); });
        list.appendChild(a);
      });
    }

    function updateActive() {
      $$('.cmdk-item', list).forEach((el, i) => {
        el.classList.toggle('active', i === activeIdx);
        if (i === activeIdx) el.scrollIntoView({ block: 'nearest' });
      });
    }

    function filter() {
      const q = input.value.toLowerCase().trim();
      filtered = TOPICS.filter(t =>
        !q || t.name.toLowerCase().includes(q) || t.short.toLowerCase().includes(q) ||
        t.slug.includes(q)
      );
      activeIdx = 0;
      render();
    }

    function open() {
      back.classList.add('show');
      input.value = '';
      filter();
      setTimeout(() => input.focus(), 30);
    }
    function close() { back.classList.remove('show'); }

    input.addEventListener('input', filter);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); activeIdx = (activeIdx + 1) % Math.max(filtered.length, 1); updateActive(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); activeIdx = (activeIdx - 1 + Math.max(filtered.length, 1)) % Math.max(filtered.length, 1); updateActive(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        const item = $$('.cmdk-item', list)[activeIdx];
        if (item) item.click();
      } else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    back.addEventListener('click', (e) => { if (e.target === back) close(); });

    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (back.classList.contains('show')) close(); else open();
      }
    });

    const trigger = $('#search-btn');
    if (trigger) trigger.addEventListener('click', open);
  }

  /* ───────── Toast helper ───────── */
  function ensureToast() {
    let t = $('#toast');
    if (t) return t;
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    t.setAttribute('role', 'status');
    t.setAttribute('aria-live', 'polite');
    document.body.appendChild(t);
    return t;
  }
  function toast(msg, kind) {
    const t = ensureToast();
    t.textContent = msg;
    t.classList.remove('success', 'error');
    if (kind) t.classList.add(kind);
    t.classList.add('show');
    clearTimeout(t._h);
    t._h = setTimeout(() => t.classList.remove('show'), 3200);
  }
  window.embsysToast = toast;

  /* ───────── Email capture (localStorage only) ─────────
     We store an array of {email, when, source} in
     localStorage under 'embsys-subscribers'. No data ever
     leaves the visitor's browser. A "Manage my data" link
     lets the visitor inspect or delete it. */
  const STORE_KEY = 'embsys-subscribers';

  function loadSubs() {
    try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; }
    catch (e) { return []; }
  }
  function saveSubs(arr) {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(arr)); }
    catch (e) { /* quota or disabled — ignore */ }
  }

  function bindSubscribeForm(form) {
    if (!form || form._bound) return;
    form._bound = true;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const hp = form.querySelector('.honeypot');
      if (hp && hp.value) return; // bot
      const emailEl = form.querySelector('input[type=email]');
      const email = (emailEl.value || '').trim();
      if (!email || !emailEl.checkValidity()) {
        toast('Please enter a valid email address.', 'error');
        emailEl.focus();
        return;
      }
      const subs = loadSubs();
      if (subs.some(s => s.email.toLowerCase() === email.toLowerCase())) {
        toast('You are already subscribed in this browser.', 'success');
      } else {
        subs.push({
          email,
          when: new Date().toISOString(),
          source: form.dataset.source || 'footer',
          extra: form.dataset.extra || ''
        });
        saveSubs(subs);
        toast('✓ Saved! Stored locally in your browser only.', 'success');
      }
      form.reset();
    });
  }

  function bindManageDataLink() {
    const link = $('#manage-data-link');
    if (!link) return;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      openManageData();
    });
  }

  function openManageData() {
    let modal = $('#manage-data-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'manage-data-modal';
      modal.className = 'modal-backdrop';
      modal.innerHTML = `
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="md-title">
          <h3 id="md-title">Your locally stored data</h3>
          <p>This site never sends your email anywhere. Everything below is stored only in <code>localStorage</code> on this device, in this browser. You can delete it at any time.</p>
          <pre id="md-contents"></pre>
          <div class="modal-actions">
            <button type="button" data-act="close">Close</button>
            <button type="button" class="danger" data-act="clear">Delete all my data</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) modal.classList.remove('show');
      });
      modal.querySelector('[data-act=close]').addEventListener('click', () => modal.classList.remove('show'));
      modal.querySelector('[data-act=clear]').addEventListener('click', () => {
        if (confirm('Delete all locally stored emails and quiz scores from this browser?')) {
          localStorage.removeItem(STORE_KEY);
          localStorage.removeItem('embsys-quiz-best');
          $('#md-contents').textContent = renderStored();
          toast('Local data cleared.', 'success');
        }
      });
    }
    $('#md-contents').textContent = renderStored();
    modal.classList.add('show');
  }

  function renderStored() {
    const data = {
      subscribers: loadSubs(),
      quizBest: localStorage.getItem('embsys-quiz-best') || null,
      theme: localStorage.getItem('embsys-theme') || null
    };
    return JSON.stringify(data, null, 2);
  }

  /* ───────── Footer + subscribe injector ─────────
     Topic subpages call window.renderSiteFooter() so we don't
     duplicate the footer HTML in every file. */
  window.renderSiteFooter = function (mountSelector) {
    const mount = $(mountSelector || '#site-footer');
    if (!mount) return;
    const r = resolvePath;
    mount.innerHTML = `
      <footer>
        <div class="container">
          <div class="footer-logo">⚙️ EmbeddedSys</div>
          <div class="footer-sub">An interactive guide to embedded systems concepts</div>

          <div class="subscribe-card">
            <h3>📬 Stay in the loop</h3>
            <p>Drop your email to bookmark this guide. Stored privately in your browser only — no server, no tracking, no spam.</p>
            <form class="subscribe-form" data-source="footer" novalidate>
              <input type="email" placeholder="you@example.com" required aria-label="Email address">
              <input type="text" class="honeypot" tabindex="-1" autocomplete="off" aria-hidden="true">
              <button type="submit">Save</button>
            </form>
            <div class="privacy-note">
              Local-only storage · <a id="manage-data-link" href="#">Manage my data</a>
            </div>
          </div>

          <div class="footer-links">
            <a href="${r('index.html')}#concepts">Concepts</a>
            <a href="${r('index.html')}#demo">Code</a>
            <a href="${r('index.html')}#peripherals">Peripherals</a>
            <a href="${r('index.html')}#architecture">Architecture</a>
            <a href="${r('index.html')}#history">History</a>
            <a href="${r('index.html')}#quiz">Quiz</a>
            <a href="${r('index.html')}#glossary">Glossary</a>
          </div>
          <div class="footer-copy">Built with pure HTML · CSS · JavaScript — no frameworks, no dependencies</div>
        </div>
      </footer>`;
    bindSubscribeForm($('.subscribe-form', mount));
    bindManageDataLink();
  };

  /* ───────── Shared nav injector for topic pages ───────── */
  window.renderSiteNav = function (mountSelector) {
    const mount = $(mountSelector || '#site-nav');
    if (!mount) return;
    const r = resolvePath;
    mount.innerHTML = `
      <nav class="site-nav">
        <div class="container nav-inner">
          <a href="${r('index.html')}" class="nav-logo">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <rect x="2" y="7" width="20" height="10" rx="2"/>
              <path d="M6 7V5M10 7V4M14 7V5M18 7V4M6 17v2M10 17v3M14 17v2M18 17v3"/>
            </svg>
            EmbeddedSys
          </a>
          <ul class="nav-links">
            <li><a href="${r('index.html')}#concepts">Concepts</a></li>
            <li><a href="${r('index.html')}#demo">Code</a></li>
            <li><a href="${r('index.html')}#peripherals">Peripherals</a></li>
            <li><a href="${r('index.html')}#history">History</a></li>
            <li><a href="${r('index.html')}#quiz">Quiz</a></li>
            <li><a href="${r('index.html')}#glossary">Glossary</a></li>
          </ul>
          <div class="nav-actions">
            <button id="search-btn" type="button" aria-label="Open topic search (Ctrl+K)">
              🔍 <span>Search</span> <kbd>⌘K</kbd>
            </button>
            <button id="theme-btn" type="button" aria-label="Toggle colour theme">🌙 Dark</button>
          </div>
        </div>
      </nav>`;
  };

  /* ───────── Related topics renderer for subpages ───────── */
  window.renderRelatedTopics = function (mountSelector, currentSlug, slugs) {
    const mount = $(mountSelector);
    if (!mount) return;
    const list = (slugs || TOPICS.map(t => t.slug)).filter(s => s !== currentSlug).slice(0, 6);
    mount.innerHTML = list.map(slug => {
      const t = TOPICS.find(x => x.slug === slug);
      if (!t) return '';
      return `<a class="related-card" href="${resolvePath('topics/' + t.slug + '.html')}" style="--topic-accent:${t.color}">
        <span class="ic" style="color:${t.color}">${t.icon}</span>
        <span>
          <div class="nm">${t.name}</div>
          <div class="ds">${t.short}</div>
        </span>
      </a>`;
    }).join('');
  };

  /* ───────── View Transitions API navigation
              (graceful fallback to normal nav) ───────── */
  function initViewTransitions() {
    if (!document.startViewTransition || prefersReducedMotion) return;
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      const href = a.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('http') ||
          a.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey) return;
      // Same-origin navigation only.
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      e.preventDefault();
      document.startViewTransition(() => { location.href = a.href; });
    });
  }

  /* ───────── Init ───────── */
  function init() {
    // If the page uses an injectable nav placeholder, render it before
    // we try to bind theme/search.
    if ($('#site-nav') && typeof window.renderSiteNav === 'function') window.renderSiteNav();
    if ($('#site-footer') && typeof window.renderSiteFooter === 'function') window.renderSiteFooter();

    initTheme();
    initReveal();
    initCircuitCanvas();
    initCounters();
    initCmdK();
    initViewTransitions();

    // Bind any subscribe forms already present (e.g. quiz prompt).
    $$('.subscribe-form').forEach(bindSubscribeForm);
    bindManageDataLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
