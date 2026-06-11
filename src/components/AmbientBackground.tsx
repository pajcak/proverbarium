import { useEffect, useRef } from "react";
import "./AmbientBackground.css";

/**
 * Extremely subtle ambient atmosphere: two slowly drifting blurred blobs,
 * a soft noise texture, and a gentle scroll parallax. Everything sits well
 * below 5% opacity so the background feels alive without distracting.
 */
export function AmbientBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        root.style.setProperty("--scroll-y", String(window.scrollY));
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div ref={rootRef} className="ambient" aria-hidden="true">
      <div className="ambient-blob ambient-blob-primary" />
      <div className="ambient-blob ambient-blob-amber" />
      <div className="ambient-noise" />
    </div>
  );
}
