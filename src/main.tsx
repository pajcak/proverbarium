import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { ThemeProvider } from "./components/ThemeProvider";
import { I18nProvider } from "./i18n/I18nContext";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <I18nProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
        </BrowserRouter>
      </I18nProvider>
    </ThemeProvider>
  </StrictMode>,
);

// PWA: offline-friendly caching in production builds.
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // Offline support is progressive enhancement — never block the app.
    });
  });
}
