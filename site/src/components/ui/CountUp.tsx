"use client";

import { useEffect, useRef, useState } from "react";

interface CountUpProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
}

/**
 * CountUp — anime un nombre de 0 vers `value` quand
 * l'élément entre dans le viewport. Format FR (fr-FR).
 * Honore prefers-reduced-motion (affiche directement la valeur finale).
 */
export function CountUp({
  value,
  prefix = "",
  suffix = "",
  decimals,
  duration = 1200,
  className = "",
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const startedRef = useRef(false);
  const computedDecimals = decimals ?? (value % 1 !== 0 ? 1 : 0);

  const formatNumber = (n: number) =>
    n.toLocaleString("fr-FR", {
      minimumFractionDigits: computedDecimals,
      maximumFractionDigits: computedDecimals,
    });

  const initial = `${prefix}${formatNumber(0)}${suffix}`;
  const [display, setDisplay] = useState<string>(initial);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const setFinal = () => setDisplay(`${prefix}${formatNumber(value)}${suffix}`);

    if (reduced) {
      setFinal();
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setFinal();
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !startedRef.current) {
            startedRef.current = true;
            const start = performance.now();
            const step = (now: number) => {
              const p = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - p, 3);
              const val = value * eased;
              setDisplay(`${prefix}${formatNumber(val)}${suffix}`);
              if (p < 1) requestAnimationFrame(step);
              else setFinal();
            };
            requestAnimationFrame(step);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 },
    );

    io.observe(node);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, prefix, suffix, duration]);

  return (
    <span ref={ref} className={className} aria-label={`${prefix}${formatNumber(value)}${suffix}`}>
      {display}
    </span>
  );
}

export default CountUp;
