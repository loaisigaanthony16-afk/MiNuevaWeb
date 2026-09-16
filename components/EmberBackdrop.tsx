"use client";

import { useEffect, useRef } from "react";

/**
 * Fondo de brasas: un resplandor cálido que respira abajo, velos de calor
 * que suben despacio y chispas doradas que ascienden y se apagan.
 *
 * Todo procedural en un canvas: pesa cero, corre igual en teléfono y en
 * PC, se pausa cuando no está a la vista y respeta "reducir movimiento"
 * (queda solo el resplandor quieto).
 */

interface Ember {
  x: number;
  y: number;
  r: number;
  vy: number;
  sway: number;
  phase: number;
  life: number;
  max: number;
  warm: number; // 0 dorado · 1 naranja
}

interface Wisp {
  x: number;
  y: number;
  r: number;
  vy: number;
  phase: number;
  a: number;
}

const GOLD = [220, 193, 131];
const ORANGE = [255, 140, 56];

function mix(t: number): string {
  const c = GOLD.map((g, i) => Math.round(g + (ORANGE[i] - g) * t));
  return `${c[0]},${c[1]},${c[2]}`;
}

export default function EmberBackdrop() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const context = el.getContext("2d");
    if (!context) return;
    const canvas: HTMLCanvasElement = el;
    const ctx: CanvasRenderingContext2D = context;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let embers: Ember[] = [];
    let wisps: Wisp[] = [];
    let raf = 0;
    let visible = true;
    let last = performance.now();
    let t = 0;

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    function spawnEmber(fresh = false): Ember {
      const max = rand(5, 11);
      return {
        x: rand(0, w),
        y: fresh ? rand(h * 0.35, h * 1.05) : h + rand(4, 40),
        r: rand(0.7, 2.2),
        vy: rand(14, 34),
        sway: rand(6, 22),
        phase: rand(0, Math.PI * 2),
        life: fresh ? rand(0, max) : 0,
        max,
        warm: Math.random() ** 2,
      };
    }

    function spawnWisp(fresh = false): Wisp {
      return {
        x: rand(-0.1, 1.1) * w,
        y: fresh ? rand(0.2, 1.1) * h : h + rand(100, 300),
        r: rand(120, 300) * Math.min(1, w / 900 + 0.55),
        vy: rand(8, 16),
        phase: rand(0, Math.PI * 2),
        a: rand(0.025, 0.055),
      };
    }

    function resize() {
      const rect = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(Math.min(70, Math.max(24, (w * h) / 16000)));
      embers = Array.from({ length: count }, () => spawnEmber(true));
      wisps = Array.from({ length: w > 700 ? 7 : 5 }, () => spawnWisp(true));
      if (reduced) drawStatic();
    }

    function glow(cx: number, cy: number, r: number, alpha: number, warm: number) {
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const c = mix(warm);
      g.addColorStop(0, `rgba(${c},${alpha})`);
      g.addColorStop(0.45, `rgba(${c},${alpha * 0.35})`);
      g.addColorStop(1, `rgba(${c},0)`);
      ctx.fillStyle = g;
      ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    }

    function drawBase(time: number) {
      // Resplandor que respira en la base, con dos focos desfasados.
      const breathe = 0.5 + 0.5 * Math.sin(time * 0.6);
      const breathe2 = 0.5 + 0.5 * Math.sin(time * 0.43 + 1.7);
      glow(w * 0.5, h * 1.02, Math.max(w, h) * (0.55 + 0.06 * breathe), 0.2 + 0.06 * breathe, 0.35);
      glow(w * 0.2, h * 1.05, Math.max(w, h) * 0.38, 0.07 + 0.04 * breathe2, 0.7);
      glow(w * 0.82, h * 1.04, Math.max(w, h) * 0.34, 0.06 + 0.04 * (1 - breathe2), 0.15);
    }

    function drawStatic() {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      drawBase(0);
      ctx.globalCompositeOperation = "source-over";
    }

    function frame(now: number) {
      raf = requestAnimationFrame(frame);
      if (!visible) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      t += dt;

      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      drawBase(t);

      // Velos de calor: grandes, lentos, casi invisibles.
      for (const s of wisps) {
        s.y -= s.vy * dt;
        const x = s.x + Math.sin(t * 0.25 + s.phase) * 40;
        const fade = Math.min(1, Math.max(0, (s.y + s.r) / (h + s.r)));
        glow(x, s.y, s.r, s.a * fade, 0.3);
        if (s.y + s.r < 0) Object.assign(s, spawnWisp());
      }

      // Chispas: suben, se mecen, titilan y se apagan.
      for (let i = 0; i < embers.length; i++) {
        const e = embers[i];
        e.life += dt;
        e.y -= e.vy * dt * (1 + 0.15 * Math.sin(t * 2 + e.phase));
        const x = e.x + Math.sin(t * 0.9 + e.phase) * e.sway;
        const p = e.life / e.max;
        const env = p < 0.15 ? p / 0.15 : p > 0.75 ? (1 - p) / 0.25 : 1;
        const flicker = 0.7 + 0.3 * Math.sin(t * (6 + e.r * 3) + e.phase * 3);
        const a = Math.max(0, env * flicker);
        if (a > 0) {
          const c = mix(e.warm);
          // Halo suave y núcleo: chispa, no punto.
          glow(x, e.y, e.r * 6, a * 0.35, e.warm);
          ctx.fillStyle = `rgba(${c},${Math.min(1, a * 0.95)})`;
          ctx.beginPath();
          ctx.arc(x, e.y, e.r, 0, Math.PI * 2);
          ctx.fill();
        }
        if (p >= 1 || e.y < -20) embers[i] = spawnEmber();
      }
      ctx.globalCompositeOperation = "source-over";
    }

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && document.visibilityState === "visible";
      last = performance.now();
    });
    io.observe(canvas);
    const onVis = () => {
      visible = document.visibilityState === "visible";
      last = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);

    if (!reduced) raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  return (
    <div className="ember-layer" aria-hidden>
      <canvas ref={ref} />
    </div>
  );
}
