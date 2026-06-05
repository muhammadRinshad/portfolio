"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { createPortal } from "react-dom";

interface P {
  x: number; y: number;
  ox: number; oy: number;
  vx: number; vy: number;
}

const STEP        = 5;
const R           = 1.8;
const SCATTER_MIN = 4;
const SCATTER_MAX = 14;
const REPEL_R     = 100;
const REPEL_F     = 6;
const SPRING      = 0.08;
const DAMP        = 0.82;

export default function ParticleText({
  lines,
  className = "",
  style,
  heroRef,
}: {
  lines: string[];
  className?: string;
  style?: React.CSSProperties;
  heroRef?: React.RefObject<HTMLElement | null>;
}) {
  const h1Ref     = useRef<HTMLHeadingElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pts       = useRef<P[]>([]);
  const rafId     = useRef(0);
  const running   = useRef(false);
  const hovered   = useRef(false);
  const mouse     = useRef({ x: -9999, y: -9999 });
  const heroMM    = useRef<((e: MouseEvent) => void) | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  /* ── draw all particles in one batched path ── */
  const draw = useCallback(() => {
    const cv  = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d")!;
    const dpr = window.devicePixelRatio || 1;
    /* reset transform each frame so coordinates are always in CSS px */
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const W = cv.width  / dpr;
    const H = cv.height / dpr;
    ctx.clearRect(0, 0, W, H);
    ctx.beginPath();
    for (const p of pts.current) {
      ctx.moveTo(p.x + R, p.y);
      ctx.arc(p.x, p.y, R, 0, 6.2832);
    }
    ctx.fillStyle = "#1A1A1D";
    ctx.fill();
  }, []);

  /* ── physics tick ── */
  const tick = useCallback(() => {
    const mx    = mouse.current.x;
    const my    = mouse.current.y;
    const isHov = hovered.current;
    let live    = false;

    for (const p of pts.current) {
      if (isHov) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d2 = dx * dx + dy * dy;
        if (d2 < REPEL_R * REPEL_R) {
          const d = Math.sqrt(d2) || 1;
          const f = ((REPEL_R - d) / REPEL_R) * REPEL_F;
          p.vx += (dx / d) * f;
          p.vy += (dy / d) * f;
        }
        p.vx *= 0.92;
        p.vy *= 0.92;
      } else {
        p.vx += (p.ox - p.x) * SPRING;
        p.vy += (p.oy - p.y) * SPRING;
        p.vx *= DAMP;
        p.vy *= DAMP;
      }
      p.x += p.vx;
      p.y += p.vy;

      if (
        Math.abs(p.vx) + Math.abs(p.vy) > 0.04 ||
        Math.abs(p.x - p.ox) + Math.abs(p.y - p.oy) > 0.15
      ) live = true;
    }

    draw();

    if (live || isHov) {
      rafId.current = requestAnimationFrame(tick);
    } else {
      running.current = false;
      /* particles settled — restore text, hide canvas */
      if (h1Ref.current)     h1Ref.current.style.opacity     = "1";
      if (canvasRef.current) canvasRef.current.style.opacity = "0";
    }
  }, [draw]);

  const startLoop = useCallback(() => {
    if (!running.current) {
      running.current = true;
      rafId.current = requestAnimationFrame(tick);
    }
  }, [tick]);

  /* ── sample text pixels → particles (offset to hero coords) ── */
  const sample = useCallback(async () => {
    const cv   = canvasRef.current;
    const h1   = h1Ref.current;
    const hero = heroRef?.current;
    if (!cv || !h1) return;

    await document.fonts.ready;

    const heroRect = hero?.getBoundingClientRect() ?? h1.getBoundingClientRect();
    const h1Rect   = h1.getBoundingClientRect();
    const dpr      = window.devicePixelRatio || 1;

    /* size canvas to hero */
    const HW = heroRect.width;
    const HH = heroRect.height;
    cv.width        = HW * dpr;
    cv.height       = HH * dpr;
    cv.style.width  = `${HW}px`;
    cv.style.height = `${HH}px`;

    /* h1 offset within hero */
    const offX = h1Rect.left - heroRect.left;
    const offY = h1Rect.top  - heroRect.top;

    /* draw text to an offscreen canvas for pixel sampling */
    const off  = document.createElement("canvas");
    const cs   = window.getComputedStyle(h1);
    const fs   = parseFloat(cs.fontSize);
    const lh   = fs * 0.88;
    const tW   = Math.ceil(h1Rect.width  * dpr);
    const tH   = Math.ceil(h1Rect.height * dpr);
    off.width  = tW;
    off.height = tH;
    const tc   = off.getContext("2d")!;
    tc.scale(dpr, dpr);
    tc.font          = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    tc.textBaseline  = "top";
    if ("letterSpacing" in tc) (tc as any).letterSpacing = `${-0.05 * fs}px`;
    tc.fillStyle = "#1A1A1D";
    lines.forEach((ln, i) => tc.fillText(ln, 0, i * lh));

    const img  = tc.getImageData(0, 0, tW, tH).data;
    const next: P[] = [];
    const s    = Math.round(STEP * dpr);

    for (let py = 0; py < tH; py += s) {
      for (let px = 0; px < tW; px += s) {
        if (img[(py * tW + px) * 4 + 3] > 100) {
          const ox = px / dpr + offX;
          const oy = py / dpr + offY;
          next.push({ x: ox, y: oy, ox, oy, vx: 0, vy: 0 });
        }
      }
    }

    pts.current = next;
    /* canvas stays hidden at rest */
  }, [lines, heroRef]);

  /* ── mouse handlers ── */
  const onEnter = useCallback(() => {
    hovered.current = true;

    /* hide text, reveal canvas */
    if (h1Ref.current)     h1Ref.current.style.opacity     = "0";
    if (canvasRef.current) canvasRef.current.style.opacity = "1";

    /* scatter */
    for (const p of pts.current) {
      const a = Math.random() * 6.2832;
      const s = SCATTER_MIN + Math.random() * (SCATTER_MAX - SCATTER_MIN);
      p.vx += Math.cos(a) * s;
      p.vy += Math.sin(a) * s;
    }

    /* track cursor across full hero */
    const hero = heroRef?.current;
    if (hero) {
      heroMM.current = (e: MouseEvent) => {
        const r = hero.getBoundingClientRect();
        mouse.current = { x: e.clientX - r.left, y: e.clientY - r.top };
      };
      hero.addEventListener("mousemove", heroMM.current);
    }

    startLoop();
  }, [heroRef, startLoop]);

  const onLeave = useCallback(() => {
    hovered.current = false;
    mouse.current   = { x: -9999, y: -9999 };

    const hero = heroRef?.current;
    if (hero && heroMM.current) {
      hero.removeEventListener("mousemove", heroMM.current);
      heroMM.current = null;
    }

    startLoop();
  }, [heroRef, startLoop]);

  /* ── lifecycle ── */
  useEffect(() => {
    /* wait until portal canvas is in the DOM (mounted = true) */
    if (!mounted) return;

    sample();
    const onResize = () => {
      cancelAnimationFrame(rafId.current);
      running.current = false;
      hovered.current = false;
      if (h1Ref.current)     h1Ref.current.style.opacity     = "1";
      if (canvasRef.current) canvasRef.current.style.opacity = "0";
      sample();
    };
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafId.current);
      const hero = heroRef?.current;
      if (hero && heroMM.current) hero.removeEventListener("mousemove", heroMM.current);
    };
  }, [sample, heroRef, mounted]);

  /* canvas portaled into hero section so particles roam freely */
  const canvas = (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        pointerEvents: "none",
        zIndex: 5,
        opacity: 0,
        transition: "opacity 0.12s ease",
      }}
    />
  );

  return (
    <>
      <div
        className={className}
        style={{ position: "relative", ...style }}
        onMouseEnter={onEnter}
        onMouseLeave={onLeave}
      >
        <h1
          ref={h1Ref}
          className="font-display font-black leading-[0.88] tracking-tighter text-[#1A1A1D] select-none"
          style={{
            fontSize: "clamp(2.8rem, 8vw, 7rem)",
            transition: "opacity 0.12s ease",
            cursor: "default",
            margin: 0,
          }}
          aria-label={lines.join(" ")}
        >
          {lines.map((ln, i) => (
            <span key={i} style={{ display: "block" }}>{ln}</span>
          ))}
        </h1>
      </div>

      {/* portal canvas into hero so it covers full section */}
      {mounted && heroRef?.current
        ? createPortal(canvas, heroRef.current)
        : null}
    </>
  );
}
