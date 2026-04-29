/* ==========================================================================
   Bitronix Lab — Living PCB background + Portfolio Journey reveal
   ========================================================================== */
(() => {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Living PCB background ----------
     Generates a Manhattan-style trace network on a fixed canvas behind the
     whole page and animates glowing data pulses traveling along the wires.
     Designed to feel like a moving microcontroller board, not a video. */
  const canvas = document.querySelector("[data-pcb-bg]");
  if (canvas && !reduced) {
    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, DPR = 1;
    let traces = [];   // { points: [{x,y}, ...], len }
    let nodes = [];    // pad/via positions {x,y,r}
    let chips = [];    // chip rectangles {x,y,w,h}
    let pulses = [];   // {trace, t, speed, hue}

    const COLORS = {
      trace: "rgba(0, 200, 200, 0.18)",
      traceGlow: "rgba(0, 245, 255, 0.10)",
      pad: "rgba(67, 199, 255, 0.55)",
      chipFill: "rgba(6, 24, 28, 0.55)",
      chipEdge: "rgba(0, 245, 255, 0.35)",
      chipPin: "rgba(255, 200, 87, 0.55)"
    };

    const rand = (a, b) => a + Math.random() * (b - a);

    const generateBoard = () => {
      traces = [];
      nodes = [];
      chips = [];
      pulses = [];

      // Chips
      const chipCount = Math.max(3, Math.round((W * H) / 380000));
      for (let i = 0; i < chipCount; i++) {
        const w = rand(70, 150);
        const h = rand(50, 110);
        chips.push({
          x: rand(60, W - w - 60),
          y: rand(60, H - h - 60),
          w, h
        });
      }

      // Manhattan traces snaking across the board
      const traceCount = Math.max(14, Math.round((W + H) / 90));
      for (let i = 0; i < traceCount; i++) {
        const startSide = Math.floor(Math.random() * 4);
        let x, y;
        switch (startSide) {
          case 0: x = rand(0, W); y = -10; break;
          case 1: x = W + 10;     y = rand(0, H); break;
          case 2: x = rand(0, W); y = H + 10; break;
          default: x = -10;       y = rand(0, H);
        }
        const points = [{ x, y }];
        const segs = Math.floor(rand(4, 9));
        let cx = x, cy = y;
        let horiz = Math.random() > 0.5;
        let len = 0;
        for (let s = 0; s < segs; s++) {
          const step = rand(60, 220);
          if (horiz) {
            cx += (Math.random() > 0.5 ? 1 : -1) * step;
          } else {
            cy += (Math.random() > 0.5 ? 1 : -1) * step;
          }
          cx = Math.max(-20, Math.min(W + 20, cx));
          cy = Math.max(-20, Math.min(H + 20, cy));
          const prev = points[points.length - 1];
          len += Math.hypot(cx - prev.x, cy - prev.y);
          points.push({ x: cx, y: cy });
          horiz = !horiz;
        }
        traces.push({ points, len });
        // pad at every corner
        points.forEach((p) => {
          if (p.x > 0 && p.x < W && p.y > 0 && p.y < H && Math.random() > 0.4) {
            nodes.push({ x: p.x, y: p.y, r: rand(1.6, 3) });
          }
        });
      }

      // Initial pulses
      const pulseCount = Math.min(28, Math.max(10, Math.round(traces.length * 0.55)));
      for (let i = 0; i < pulseCount; i++) {
        pulses.push({
          trace: Math.floor(Math.random() * traces.length),
          t: Math.random(),
          speed: rand(0.0009, 0.0022),
          hue: Math.random() > 0.55 ? 184 : (Math.random() > 0.5 ? 200 : 42)
        });
      }
    };

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      generateBoard();
    };

    // Sample a point along a polyline at parameter t (0..1)
    const sampleTrace = (trace, t) => {
      const target = trace.len * t;
      let acc = 0;
      const pts = trace.points;
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        const seg = Math.hypot(b.x - a.x, b.y - a.y);
        if (acc + seg >= target) {
          const k = (target - acc) / seg;
          return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k };
        }
        acc += seg;
      }
      return pts[pts.length - 1];
    };

    const drawTraceLine = (trace, style, width) => {
      ctx.beginPath();
      const pts = trace.points;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = style;
      ctx.lineWidth = width;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();
    };

    const draw = () => {
      ctx.clearRect(0, 0, W, H);

      // Soft glow base
      ctx.globalCompositeOperation = "source-over";

      // Traces — outer glow then core line
      ctx.shadowColor = "rgba(0, 245, 255, 0.4)";
      ctx.shadowBlur = 6;
      traces.forEach((t) => drawTraceLine(t, COLORS.traceGlow, 3));
      ctx.shadowBlur = 0;
      traces.forEach((t) => drawTraceLine(t, COLORS.trace, 1));

      // Pads
      nodes.forEach((n) => {
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.pad;
        ctx.fill();
      });

      // Chips
      chips.forEach((c) => {
        ctx.fillStyle = COLORS.chipFill;
        ctx.strokeStyle = COLORS.chipEdge;
        ctx.lineWidth = 1;
        ctx.fillRect(c.x, c.y, c.w, c.h);
        ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
        // pins on sides
        ctx.fillStyle = COLORS.chipPin;
        const pinCount = Math.floor(c.w / 12);
        for (let i = 0; i < pinCount; i++) {
          const px = c.x + 6 + i * 12;
          ctx.fillRect(px, c.y - 4, 6, 4);
          ctx.fillRect(px, c.y + c.h, 6, 4);
        }
      });

      // Pulses
      ctx.globalCompositeOperation = "lighter";
      pulses.forEach((p) => {
        p.t += p.speed;
        if (p.t > 1) {
          p.t = 0;
          p.trace = Math.floor(Math.random() * traces.length);
          p.hue = Math.random() > 0.55 ? 184 : (Math.random() > 0.5 ? 200 : 42);
        }
        const trace = traces[p.trace];
        if (!trace) return;
        const pos = sampleTrace(trace, p.t);
        const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 14);
        grd.addColorStop(0, `hsla(${p.hue}, 100%, 70%, 0.95)`);
        grd.addColorStop(0.4, `hsla(${p.hue}, 100%, 60%, 0.45)`);
        grd.addColorStop(1, `hsla(${p.hue}, 100%, 50%, 0)`);
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 14, 0, Math.PI * 2);
        ctx.fill();
        // bright core
        ctx.fillStyle = `hsla(${p.hue}, 100%, 92%, 0.95)`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";

      requestAnimationFrame(draw);
    };

    let resizeTimer = 0;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(resize, 180);
    });

    resize();
    requestAnimationFrame(draw);
  }

  /* ---------- 3D mouse tilt for [data-tilt-3d] elements ---------- */
  if (!reduced) {
    const tiltEls = document.querySelectorAll("[data-tilt-3d]");
    tiltEls.forEach((el) => {
      const max = 14; // degrees
      el.addEventListener("pointermove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;
        const ry = (x - 0.5) * (max * 2);
        const rx = (0.5 - y) * (max * 2);
        el.style.setProperty("--ry", ry + "deg");
        el.style.setProperty("--rx", rx + "deg");
        // also tilt the wrap itself for the YouTube player etc.
        el.style.transform = `perspective(1000px) rotateX(${rx * 0.5}deg) rotateY(${ry * 0.5}deg)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.setProperty("--ry", "0deg");
        el.style.setProperty("--rx", "0deg");
        el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
      });
    });
  }

  /* ---------- Journey reveal on scroll ---------- */
  const steps = document.querySelectorAll("[data-journey-step]");
  if (steps.length && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -10% 0px" });
    steps.forEach((s) => io.observe(s));
  } else {
    steps.forEach((s) => s.classList.add("is-visible"));
  }
})();
