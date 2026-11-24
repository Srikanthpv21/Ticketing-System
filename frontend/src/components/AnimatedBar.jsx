import { useEffect, useState } from "react";

// A progress bar whose fill grows in on mount and eases when `percent` changes.
export default function AnimatedBar({ percent, fillClass = "bg-blue-700" }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="mt-1.5 h-2 rounded-full bg-gray-100 overflow-hidden">
      <div
        className={`h-2 rounded-full transition-[width] duration-700 ease-out ${fillClass}`}
        style={{ width: ready ? `${Math.max(0, Math.min(100, percent))}%` : "0%" }}
      />
    </div>
  );
}
