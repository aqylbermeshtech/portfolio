"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*<>/\\|~";

function randomChar() {
  return CHARS[Math.floor(Math.random() * CHARS.length)];
}

export default function Scramble({
  text,
  className,
  delay = 0,
  replayOnHover = false,
}: {
  text: string;
  className?: string;
  delay?: number;
  replayOnHover?: boolean;
}) {
  const [display, setDisplay] = useState(text);
  const isFirst = useRef(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const runScramble = useCallback(
    (startDelay: number) => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        timeoutRef.current = setTimeout(() => setDisplay(text), 0);
        return;
      }

      const chars = text.split("");
      let revealed = 0;
      // Cap total reveal time so long lines don't drag; short words still animate briskly.
      const totalDuration = Math.min(900, 400 + chars.length * 6);
      const stepMs = Math.max(12, totalDuration / Math.max(chars.length, 1));

      timeoutRef.current = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          revealed++;
          setDisplay(
            chars
              .map((ch, i) => (ch === " " || i < revealed ? ch : randomChar()))
              .join(""),
          );
          if (revealed >= chars.length) {
            clearInterval(intervalRef.current);
            setDisplay(text);
          }
        }, stepMs);
      }, startDelay);
    },
    [text],
  );

  useEffect(() => {
    runScramble(isFirst.current ? delay : 0);
    isFirst.current = false;
    return () => {
      clearTimeout(timeoutRef.current);
      clearInterval(intervalRef.current);
    };
    // delay is only meant to apply on first mount, not on later text changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, runScramble]);

  return (
    <span
      className={className}
      onMouseEnter={replayOnHover ? () => runScramble(0) : undefined}
    >
      <span aria-hidden="true">{display}</span>
      <span className="sr-only">{text}</span>
    </span>
  );
}
