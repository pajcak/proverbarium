import { useRef } from "react";
import { useI18n } from "../i18n/I18nContext";
import { FeaturedProverb } from "./FeaturedProverb";
import type { ProverbWithConcepts } from "../data/types";
import "./SearchHero.css";

interface SearchHeroProps {
  query: string;
  onQueryChange: (query: string) => void;
  featuredPool: ProverbWithConcepts[];
  /** False while results are shown (text search or topic filter). */
  showFeatured: boolean;
}

export function SearchHero({
  query,
  onQueryChange,
  featuredPool,
  showFeatured,
}: SearchHeroProps) {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <section className="search-hero">
      <div className="container search-hero-inner">
        <h1 className="search-hero-title">{t.heroTitle}</h1>
        <p className="search-hero-subtitle">{t.heroSubtitle}</p>

        <div className="search-field-wrap">
          <div className="search-field" role="search">
            <svg
              className="search-icon"
              viewBox="0 0 24 24"
              width="22"
              height="22"
              aria-hidden="true"
            >
              <path
                d="M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19l-4.99-5Zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14Z"
                fill="currentColor"
              />
            </svg>
            <input
              ref={inputRef}
              type="search"
              className="search-input"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder={t.searchPlaceholder}
              aria-label={t.searchLabel}
              autoComplete="off"
              spellCheck={false}
              enterKeyHint="search"
            />
            {query.length > 0 && (
              <button
                type="button"
                className="search-clear"
                aria-label={t.clearSearch}
                onClick={() => {
                  onQueryChange("");
                  inputRef.current?.focus();
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                  <path
                    d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41Z"
                    fill="currentColor"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {showFeatured && <FeaturedProverb proverbs={featuredPool} />}
      </div>
    </section>
  );
}
