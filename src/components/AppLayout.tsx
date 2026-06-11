import type { ReactNode } from "react";
import { useI18n } from "../i18n/I18nContext";
import { AmbientBackground } from "./AmbientBackground";
import { TopAppBar } from "./TopAppBar";
import "./AppLayout.css";

export function AppLayout({ children }: { children: ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="app-layout">
      <a href="#main" className="skip-link">
        {t.skipToContent}
      </a>
      <AmbientBackground />
      <TopAppBar />
      <main id="main" className="app-main">
        {children}
      </main>
      <footer className="app-footer">
        <div className="container">
          <p>
            <span className="app-footer-brand">{t.appName}</span> — {t.footerNote}
          </p>
        </div>
      </footer>
    </div>
  );
}
