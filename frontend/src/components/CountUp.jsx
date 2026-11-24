import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

// Animates a whole number from its previous value to `value`.
export default function CountUp({ value, duration = 700 }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    let raf;

    if (prefersReducedMotion()) {
      raf = requestAnimationFrame(() => {
        fromRef.current = value;
        setDisplay(value);
      });
      return () => cancelAnimationFrame(raf);
    }

    const from = fromRef.current;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const next = Math.round(from + (value - from) * eased);
      fromRef.current = next;
      setDisplay(next);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return <>{display}</>;
}
