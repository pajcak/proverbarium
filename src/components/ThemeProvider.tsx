import type { ReactNode } from "react";
import "../styles/global.css";

/**
 * Owns the design system entry point. The MD3-inspired theme lives in CSS
 * custom properties (styles/tokens.css); this component is the seam where a
 * future dark theme or user theming preference would be injected.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return <div className="theme-light">{children}</div>;
}
