import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import "./TopAppBar.css";

export function TopAppBar() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`top-app-bar${scrolled ? " is-scrolled" : ""}`}>
      <div className="container top-app-bar-inner">
        <Link to="/" className="brand" aria-label={t.appName}>
          <svg
            className="brand-mark"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            aria-hidden="true"
          >
            <path
              d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5C4.7 20 4 19.3 4 18.5v-13Z"
              fill="currentColor"
              opacity="0.55"
            />
            <path
              d="M20 5.5C20 4.7 19.3 4 18.5 4H13v16h5.5c.8 0 1.5-.7 1.5-1.5v-13Z"
              fill="currentColor"
            />
          </svg>
          <span className="brand-name">{t.appName}</span>
          <span className="brand-tagline">{t.appTagline}</span>
        </Link>
        <LanguageSwitcher />
      </div>
    </header>
  );
}
