"use client";

import { useEffect, useState } from "react";
import Scramble from "./Scramble";

const HEROES = [
  "iron man",
  "spider-man",
  "captain america",
  "thor",
  "hulk",
  "black widow",
  "hawkeye",
  "doctor strange",
  "black panther",
  "scarlet witch",
  "vision",
  "ant-man",
  "captain marvel",
  "star-lord",
  "groot",
  "rocket raccoon",
  "nick fury",
  "loki",
  "wolverine",
  "storm",
  "falcon",
  "winter soldier",
];

const MIN_DELAY = 6000;
const MAX_DELAY = 14000;
const HOLD_MS = 1800;
const FADE_MS = 700;

function randomDelay() {
  return MIN_DELAY + Math.random() * (MAX_DELAY - MIN_DELAY);
}

function randomHero() {
  return {
    text: HEROES[Math.floor(Math.random() * HEROES.length)],
    top: `${5 + Math.random() * 80}%`,
    left: `${5 + Math.random() * 80}%`,
  };
}

// A quiet easter egg: every so often a hero's name decodes out of the
// braille noise, holds briefly, then dissolves back into it.
export default function HeroWhisper() {
  const [hero, setHero] = useState<ReturnType<typeof randomHero> | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let showTimer: ReturnType<typeof setTimeout>;
    let hideTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const scheduleNext = (delay: number) => {
      showTimer = setTimeout(() => {
        if (cancelled) return;
        setHero(randomHero());
        setVisible(true);

        hideTimer = setTimeout(() => {
          if (cancelled) return;
          setVisible(false);

          clearTimer = setTimeout(() => {
            if (cancelled) return;
            setHero(null);
            scheduleNext(randomDelay());
          }, FADE_MS);
        }, HOLD_MS);
      }, delay);
    };

    scheduleNext(randomDelay());

    return () => {
      cancelled = true;
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      clearTimeout(clearTimer);
    };
  }, []);

  if (!hero) return null;

  return (
    <span
      className="absolute font-mono text-xs text-foreground transition-opacity ease-out"
      style={{
        top: hero.top,
        left: hero.left,
        opacity: visible ? 0.4 : 0,
        transitionDuration: `${FADE_MS}ms`,
      }}
    >
      <Scramble text={hero.text} />
    </span>
  );
}
