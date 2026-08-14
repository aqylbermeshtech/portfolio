"use client";

import { useEffect, useRef } from "react";
import HeroWhisper from "./HeroWhisper";

const CHARS = "⠁⠂⠄⡀⠈⠐⠠⢀⠃⠅⠘⠨⠰⣀⠉⠋⠛⠓⠙⠑⠡⠱⢃⢓" + "      ";
const MEASURE_CHAR = CHARS.trim()[0];
const MEASURE_LEN = 100;

const TRAIL_DURATION = 700; // ms a trail point stays visible before fully fading
const TRAIL_RADIUS = 130; // px
const TRAIL_MIN_SPACING = 100; // px^2, skip new points closer than ~10px to the last
const TRAIL_MAX_POINTS = 24;

const TWINKLE_SPAWN_MIN = 150; // ms between spawns
const TWINKLE_SPAWN_MAX = 420;
const TWINKLE_LIFE_MIN = 500; // ms a single flash lives
const TWINKLE_LIFE_MAX = 1100;
const TWINKLE_RADIUS_MIN = 14; // px
const TWINKLE_RADIUS_MAX = 28;
const TWINKLE_MAX_POINTS = 14;

// Home zone (0 = left third, 1 = center third, 2 = right third) for each
// sparkle: 2 left, 3 center, 2 right.
const SPARKLE_ZONES = [0, 0, 1, 1, 1, 2, 2] as const;
const SPARKLE_COUNT = SPARKLE_ZONES.length;
const SPARKLE_GLOW_RADIUS = 80; // px

const EMPTY_MASK =
  "radial-gradient(circle 0px at 0px 0px, transparent 0%, transparent 100%)";

function generateNoise(rows: number, cols: number) {
  let out = "";
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      out += CHARS[Math.floor(Math.random() * CHARS.length)];
    }
    out += "\n";
  }
  return out;
}

type TrailPoint = { x: number; y: number; t: number };
type Twinkle = { x: number; y: number; t: number; life: number; radius: number };
type Sparkle = {
  baseX: number;
  baseY: number;
  ampX: number;
  ampY: number;
  freqX: number;
  freqY: number;
  phaseX: number;
  phaseY: number;
};

export default function NoiseBackground() {
  const baseRef = useRef<HTMLPreElement>(null);
  const spotlightRef = useRef<HTMLPreElement>(null);
  const twinkleRef = useRef<HTMLPreElement>(null);
  const sparkleGlowRef = useRef<HTMLPreElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const sparkleStarRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const trailRef = useRef<TrailPoint[]>([]);
  const trailRafRef = useRef<number | null>(null);
  const twinklePointsRef = useRef<Twinkle[]>([]);
  const twinkleRafRef = useRef<number | null>(null);
  const sparkleRafRef = useRef<number | null>(null);

  useEffect(() => {
    const base = baseRef.current;
    const spotlight = spotlightRef.current;
    const twinkle = twinkleRef.current;
    const sparkleGlow = sparkleGlowRef.current;
    const measure = measureRef.current;
    if (!base || !spotlight || !twinkle || !sparkleGlow || !measure) return;

    const fillNoise = () => {
      // Measure the font's real advance width instead of assuming a fixed
      // pixel size, so the grid always exactly covers the viewport with no
      // unfilled strip at the edge.
      const charWidth = measure.getBoundingClientRect().width / MEASURE_LEN;
      const lineHeight = parseFloat(getComputedStyle(base).lineHeight) || 16;
      const cols = Math.ceil(window.innerWidth / charWidth) + 1;
      const rows = Math.ceil(window.innerHeight / lineHeight) + 1;
      const noise = generateNoise(rows, cols);
      base.textContent = noise;
      spotlight.textContent = noise;
      twinkle.textContent = noise;
      sparkleGlow.textContent = noise;
    };

    fillNoise();

    let resizeTimer: ReturnType<typeof setTimeout>;
    const handleResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(fillNoise, 150);
    };
    window.addEventListener("resize", handleResize);

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // Fades a short trail of past cursor positions in and back out again,
    // by compositing one radial-gradient mask stop per point whose alpha
    // decays with age. Runs only while points are alive; stops itself once
    // the trail fully fades so an idle cursor costs nothing.
    const trailTick = () => {
      const now = performance.now();
      const trail = trailRef.current.filter(
        (p) => now - p.t < TRAIL_DURATION,
      );
      trailRef.current = trail;

      if (trail.length === 0) {
        trailRafRef.current = null;
        return;
      }

      const mask = trail
        .map((p) => {
          const alpha = Math.max(0, 1 - (now - p.t) / TRAIL_DURATION);
          return `radial-gradient(circle ${TRAIL_RADIUS}px at ${p.x}px ${p.y}px, rgba(0,0,0,${alpha}) 0%, transparent 70%)`;
        })
        .join(", ");

      spotlight.style.maskImage = mask;
      spotlight.style.webkitMaskImage = mask;
      trailRafRef.current = requestAnimationFrame(trailTick);
    };

    const handleMove = (event: PointerEvent) => {
      const points = trailRef.current;
      const last = points[points.length - 1];
      const dx = last ? event.clientX - last.x : Infinity;
      const dy = last ? event.clientY - last.y : Infinity;
      if (dx * dx + dy * dy < TRAIL_MIN_SPACING) return;

      points.push({ x: event.clientX, y: event.clientY, t: performance.now() });
      if (points.length > TRAIL_MAX_POINTS) points.shift();

      if (trailRafRef.current === null) {
        trailRafRef.current = requestAnimationFrame(trailTick);
      }
    };

    if (!prefersReducedMotion) window.addEventListener("pointermove", handleMove);

    let cancelled = false;
    let spawnTimer: ReturnType<typeof setTimeout>;

    if (!prefersReducedMotion) {
      // Ambient sparkle: small flashes spawn at random spots across the
      // whole viewport on their own irregular schedule, each rising and
      // fading with a smooth pulse rather than the trail's linear decay,
      // so it reads as scattered twinkling rather than a cursor effect.
      const twinkleTick = () => {
        const now = performance.now();
        const points = twinklePointsRef.current.filter(
          (p) => now - p.t < p.life,
        );
        twinklePointsRef.current = points;

        if (points.length === 0) {
          twinkleRafRef.current = null;
          return;
        }

        const mask = points
          .map((p) => {
            const progress = (now - p.t) / p.life;
            const alpha = Math.max(0, Math.sin(progress * Math.PI));
            return `radial-gradient(circle ${p.radius}px at ${p.x}px ${p.y}px, rgba(0,0,0,${alpha}) 0%, transparent 75%)`;
          })
          .join(", ");

        twinkle.style.maskImage = mask;
        twinkle.style.webkitMaskImage = mask;
        twinkleRafRef.current = requestAnimationFrame(twinkleTick);
      };

      const spawn = () => {
        if (cancelled) return;
        const points = twinklePointsRef.current;
        points.push({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          t: performance.now(),
          life: TWINKLE_LIFE_MIN + Math.random() * (TWINKLE_LIFE_MAX - TWINKLE_LIFE_MIN),
          radius: TWINKLE_RADIUS_MIN + Math.random() * (TWINKLE_RADIUS_MAX - TWINKLE_RADIUS_MIN),
        });
        if (points.length > TWINKLE_MAX_POINTS) points.shift();

        if (twinkleRafRef.current === null) {
          twinkleRafRef.current = requestAnimationFrame(twinkleTick);
        }
        spawnTimer = setTimeout(
          spawn,
          TWINKLE_SPAWN_MIN + Math.random() * (TWINKLE_SPAWN_MAX - TWINKLE_SPAWN_MIN),
        );
      };

      spawn();
    }

    if (!prefersReducedMotion) {
      // Gold sparkles that wander slowly along independent sine paths
      // (a Lissajous-style drift). Each frame we know their exact position,
      // so their glow is a live radial-gradient mask on the noise beneath
      // them: it brightens wherever a sparkle currently is and fades away
      // on its own as the sparkle moves elsewhere, with no separate timer.
      const zoneWidth = window.innerWidth / 3;
      const sparkles: Sparkle[] = SPARKLE_ZONES.map((zone) => ({
        baseX: zone * zoneWidth + zoneWidth * (0.15 + Math.random() * 0.7),
        baseY: Math.random() * window.innerHeight,
        ampX: 40 + Math.random() * 60,
        ampY: 40 + Math.random() * 60,
        freqX: 0.05 + Math.random() * 0.08,
        freqY: 0.05 + Math.random() * 0.08,
        phaseX: Math.random() * Math.PI * 2,
        phaseY: Math.random() * Math.PI * 2,
      }));

      const sparkleTick = () => {
        const t = performance.now() / 1000;
        const positions = sparkles.map((s) => ({
          x: s.baseX + Math.sin(t * s.freqX + s.phaseX) * s.ampX,
          y: s.baseY + Math.sin(t * s.freqY + s.phaseY) * s.ampY,
        }));

        positions.forEach((p, i) => {
          const star = sparkleStarRefs.current[i];
          if (star) star.style.transform = `translate(${p.x}px, ${p.y}px)`;
        });

        const mask = positions
          .map(
            (p) =>
              `radial-gradient(circle ${SPARKLE_GLOW_RADIUS}px at ${p.x}px ${p.y}px, rgba(0,0,0,1) 0%, transparent 75%)`,
          )
          .join(", ");
        sparkleGlow.style.maskImage = mask;
        sparkleGlow.style.webkitMaskImage = mask;

        sparkleRafRef.current = requestAnimationFrame(sparkleTick);
      };

      sparkleRafRef.current = requestAnimationFrame(sparkleTick);
    }

    return () => {
      cancelled = true;
      clearTimeout(resizeTimer);
      clearTimeout(spawnTimer);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("pointermove", handleMove);
      if (trailRafRef.current !== null) cancelAnimationFrame(trailRafRef.current);
      if (twinkleRafRef.current !== null) cancelAnimationFrame(twinkleRafRef.current);
      if (sparkleRafRef.current !== null) cancelAnimationFrame(sparkleRafRef.current);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 select-none overflow-hidden"
    >
      <span
        ref={measureRef}
        className="invisible absolute whitespace-pre font-mono text-[10px]"
      >
        {MEASURE_CHAR.repeat(MEASURE_LEN)}
      </span>
      <pre
        ref={baseRef}
        className="absolute inset-0 whitespace-pre-wrap break-all font-mono text-[10px] leading-4 text-foreground opacity-[0.035]"
      />
      <pre
        ref={spotlightRef}
        className="absolute inset-0 whitespace-pre-wrap break-all font-mono text-[10px] leading-4 text-foreground opacity-30"
        style={{ maskImage: EMPTY_MASK, WebkitMaskImage: EMPTY_MASK }}
      />
      <pre
        ref={twinkleRef}
        className="absolute inset-0 whitespace-pre-wrap break-all font-mono text-[10px] leading-4 text-foreground opacity-50"
        style={{ maskImage: EMPTY_MASK, WebkitMaskImage: EMPTY_MASK }}
      />
      <pre
        ref={sparkleGlowRef}
        className="absolute inset-0 whitespace-pre-wrap break-all font-mono text-[10px] leading-4 text-[var(--selection)] opacity-60"
        style={{ maskImage: EMPTY_MASK, WebkitMaskImage: EMPTY_MASK }}
      />
      {Array.from({ length: SPARKLE_COUNT }, (_, i) => (
        <span
          key={i}
          ref={(el) => {
            sparkleStarRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 font-mono text-base text-[var(--selection)]"
        >
          ✦
        </span>
      ))}
      <HeroWhisper />
    </div>
  );
}
