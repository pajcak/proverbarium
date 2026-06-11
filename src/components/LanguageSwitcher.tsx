import { useI18n } from "../i18n/I18nContext";
import { useRipple } from "../hooks/useRipple";
import type { LanguageCode } from "../data/types";
import "./LanguageSwitcher.css";

const OPTIONS: Array<{ code: LanguageCode; label: string }> = [
  { code: "cs", label: "CS" },
  { code: "en", label: "EN" },
];

export function LanguageSwitcher() {
  const { language, t, setLanguage } = useI18n();
  const ripple = useRipple();

  return (
    <div className="lang-switcher" role="group" aria-label={t.switchLanguageLabel}>
      {OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          className={`lang-option ripple-host${language === option.code ? " is-active" : ""}`}
          aria-pressed={language === option.code}
          aria-label={t.languageNames[option.code]}
          onPointerDown={ripple}
          onClick={() => setLanguage(option.code)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
