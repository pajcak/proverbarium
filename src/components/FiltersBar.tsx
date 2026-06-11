import { useI18n } from "../i18n/I18nContext";
import { useRipple } from "../hooks/useRipple";
import type { Concept, LanguageCode } from "../data/types";
import "./FiltersBar.css";

export type SortOrder = "relevance" | "alphabetical";

interface FiltersBarProps {
  availableConcepts: Concept[];
  selectedConcepts: ReadonlySet<number>;
  onToggleConcept: (id: number) => void;
  selectedLanguages: ReadonlySet<LanguageCode>;
  onToggleLanguage: (code: LanguageCode) => void;
  sort: SortOrder;
  onSortChange: (sort: SortOrder) => void;
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17Z"
        fill="currentColor"
      />
    </svg>
  );
}

interface ChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
}

function FilterChip({ label, selected, onClick }: ChipProps) {
  const ripple = useRipple();
  return (
    <button
      type="button"
      className={`filter-chip ripple-host${selected ? " is-selected" : ""}`}
      aria-pressed={selected}
      onPointerDown={ripple}
      onClick={onClick}
    >
      {selected && <CheckIcon />}
      <span>{label}</span>
    </button>
  );
}

/**
 * Progressive disclosure: rendered only once search results exist.
 * Rows scroll horizontally on small screens.
 */
export function FiltersBar({
  availableConcepts,
  selectedConcepts,
  onToggleConcept,
  selectedLanguages,
  onToggleLanguage,
  sort,
  onSortChange,
}: FiltersBarProps) {
  const { language, t } = useI18n();
  const languages: LanguageCode[] = ["cs", "en"];

  return (
    <div className="filters-bar">
      <div className="filters-row" role="group" aria-label={t.filterLanguage}>
        <span className="filters-label">{t.filterLanguage}</span>
        {languages.map((code) => (
          <FilterChip
            key={code}
            label={t.languageNames[code]}
            selected={selectedLanguages.has(code)}
            onClick={() => onToggleLanguage(code)}
          />
        ))}
        <span className="filters-divider" aria-hidden="true" />
        <span className="filters-label">{t.filterSort}</span>
        <FilterChip
          label={t.sortRelevance}
          selected={sort === "relevance"}
          onClick={() => onSortChange("relevance")}
        />
        <FilterChip
          label={t.sortAlphabetical}
          selected={sort === "alphabetical"}
          onClick={() => onSortChange("alphabetical")}
        />
      </div>

      {availableConcepts.length > 0 && (
        <div className="filters-row" role="group" aria-label={t.filterConcepts}>
          <span className="filters-label">{t.filterConcepts}</span>
          {availableConcepts.map((concept) => (
            <FilterChip
              key={concept.id}
              label={concept.name[language]}
              selected={selectedConcepts.has(concept.id)}
              onClick={() => onToggleConcept(concept.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
