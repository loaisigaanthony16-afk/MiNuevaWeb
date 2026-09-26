"use client";

import { useEffect, useRef } from "react";

/**
 * Humo en movimiento: ruido fractal deformado dos veces (domain warping)
 * que sube despacio, más denso abajo y disipándose arriba. Gris cálido con
 * vetas doradas, sobre el fondo oscuro de la página.
 *
 * Un solo shader de WebGL dibujado a media resolución (el humo es borroso
 * por naturaleza, no se nota), a ~30 fps. Se pausa fuera de la vista o con
 * la pestaña oculta, sigue un poco al puntero y con "reducir movimiento"
 * queda un solo cuadro quieto. Sin WebGL no dibuja nada: queda el halo CSS.
 */

const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = rot * p * 2.02 + 0.13;
    a *= 0.5;
  }
  return v;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  p += uPointer * 0.06;
  float t = uTime * 0.05;

  vec2 q = vec2(fbm(p * 1.3 + vec2(0.0, -t * 2.0)),
                fbm(p * 1.3 + vec2(5.2, 1.3 - t * 1.6)));
  vec2 w = vec2(fbm(p * 1.1 + 3.0 * q + vec2(1.7, 9.2) + t * 0.6),
                fbm(p * 1.1 + 3.0 * q + vec2(8.3, 2.8) - t * 0.8));
  float s = fbm(p * 1.0 + 2.4 * w + vec2(0.0, -t * 3.0));

  // Denso abajo, se deshace al subir.
  float rise = smoothstep(1.15, -0.1, uv.y);
  float d = smoothstep(0.3, 0.82, s);
  d = pow(d, 1.1) * (0.4 + 0.6 * rise);

  // Gris humo en el cuerpo, bordes de las volutas más claros y dorados.
  float edge = smoothstep(0.35, 0.75, length(w - q));
  vec3 smoke = mix(vec3(0.6, 0.58, 0.56), vec3(0.96, 0.84, 0.58), edge * 0.8);
  float a = d * 0.62;
  a *= smoothstep(1.35, 0.25, length((uv - vec2(0.55, 0.45)) * vec2(1.0, 1.1)));

  gl_FragColor = vec4(smoke * a, a);
}
`;

function compile(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type);
  if (!s) return null;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    gl.deleteShader(s);
    return null;
  }
  return s;
}

export default function SmokeBackdrop({ className = "" }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: true, antialias: false, premultipliedAlpha: true, powerPreference: "low-power" });
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    const prog = gl.createProgram();
    if (!vs || !fs || !prog) return;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    // Un triángulo que cubre toda la pantalla.
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "uRes");
    const uTime = gl.getUniformLocation(prog, "uTime");
    const uPointer = gl.getUniformLocation(prog, "uPointer");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const SCALE = 0.5;
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    let visible = true;
    let raf = 0;
    let last = 0;
    // Arranca con el humo ya formado, no desde cero.
    const t0 = performance.now() - 40000;

    function resize() {
      const w = Math.max(1, Math.round(canvas!.clientWidth * SCALE));
      const h = Math.max(1, Math.round(canvas!.clientHeight * SCALE));
      if (canvas!.width !== w || canvas!.height !== h) {
        canvas!.width = w;
        canvas!.height = h;
      }
      gl!.viewport(0, 0, w, h);
      gl!.uniform2f(uRes, w, h);
    }

    function draw(now: number) {
      pointer.x += (pointer.tx - pointer.x) * 0.04;
      pointer.y += (pointer.ty - pointer.y) * 0.04;
      gl!.uniform1f(uTime, (now - t0) / 1000);
      gl!.uniform2f(uPointer, pointer.x, pointer.y);
      gl!.drawArrays(gl!.TRIANGLES, 0, 3);
    }

    function frame(now: number) {
      raf = 0;
      if (!visible || document.hidden) return;
      if (now - last >= 33) {
        last = now;
        draw(now);
      }
      raf = requestAnimationFrame(frame);
    }

    function start() {
      if (reduced || raf) return;
      raf = requestAnimationFrame(frame);
    }

    function onPointer(e: PointerEvent) {
      if (e.pointerType === "touch") return;
      pointer.tx = e.clientX / window.innerWidth - 0.5;
      pointer.ty = 0.5 - e.clientY / window.innerHeight;
    }

    const ro = new ResizeObserver(() => {
      resize();
      if (reduced) draw(performance.now());
    });
    ro.observe(canvas);
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) start();
    });
    io.observe(canvas);
    const onVisibility = () => {
      if (!document.hidden) start();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointer, { passive: true });

    resize();
    draw(performance.now());
    start();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
