import { useCallback } from "react";
import type { PointerEvent } from "react";

/**
 * Material ripple. Attach the returned handler to `onPointerDown` of an
 * element carrying the `ripple-host` class.
 */
export function useRipple() {
  return useCallback((event: PointerEvent<HTMLElement>) => {
    const host = event.currentTarget;
    const rect = host.getBoundingClientRect();
    const diameter = Math.max(rect.width, rect.height) * 2;

    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.width = `${diameter}px`;
    ripple.style.height = `${diameter}px`;
    ripple.style.left = `${event.clientX - rect.left - diameter / 2}px`;
    ripple.style.top = `${event.clientY - rect.top - diameter / 2}px`;

    host.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  }, []);
}
