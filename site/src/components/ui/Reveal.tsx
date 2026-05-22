"use client";

import { useEffect, useRef, useState } from "react";

interface RevealProps {
  children: React.ReactNode;
  /**
   * Delay in milliseconds applied as inline transition-delay
   * (used to manually stagger when not relying on auto stagger).
   */
  delay?: number;
  /** Tag override (default span/div). */
  as?: keyof React.JSX.IntrinsicElements;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reveal — wrapper qui ajoute la classe .reveal puis .in
 * dès que l'élément entre dans le viewport.
 * Honore prefers-reduced-motion (apparition immédiate).
 */
export function Reveal({
  children,
  delay,
  as = "div",
  className = "",
  style,
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduced) {
      setShown(true);
      return;
    }

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShown(true);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );

    io.observe(node);
    return () => io.disconnect();
  }, []);

  const Tag = as as React.ElementType;
  const mergedStyle: React.CSSProperties = {
    ...(style || {}),
    ...(delay ? { transitionDelay: `${delay}ms` } : {}),
  };

  return (
    <Tag
      ref={ref as React.RefObject<HTMLElement>}
      className={`reveal${shown ? " in" : ""}${className ? " " + className : ""}`}
      style={mergedStyle}
    >
      {children}
    </Tag>
  );
}

export default Reveal;
