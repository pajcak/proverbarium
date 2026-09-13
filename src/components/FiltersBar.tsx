import { useEffect, useId, useRef, type ReactNode } from "react";
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

interface FilterGroupProps {
  label: string;
  /** Shown next to the label, e.g. how many chips are selected. */
  badge?: number;
  variant: "compact" | "scroll";
  /** Changes whenever the selection changes; resets horizontal scroll. */
  selectionKey?: string;
  children: ReactNode;
}

function FilterGroup({ label, badge, variant, selectionKey, children }: FilterGroupProps) {
  const labelId = useId();
  const chipsRef = useRef<HTMLDivElement>(null);

  // Selected chips move to the front, so bring the scrollable row back to its
  // start — otherwise the chip just tapped would slide out of view.
  useEffect(() => {
    const row = chipsRef.current;
    if (!row || row.scrollLeft === 0) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollTo({ left: 0, behavior: reduceMotion ? "auto" : "smooth" });
  }, [selectionKey]);
  return (
    <div
      className={`filters-group filters-group--${variant}`}
      role="group"
      aria-labelledby={labelId}
    >
      <span className="filters-label" id={labelId}>
        {label}
        {badge ? <span className="filters-badge">{badge}</span> : null}
      </span>
      <div className="filters-chips" ref={chipsRef}>
        {children}
      </div>
    </div>
  );
}

/**
 * Progressive disclosure: rendered only once search results exist.
 * Each group keeps its label visible; on small screens the concept chips
 * scroll horizontally while language and sort wrap in two columns.
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
      <FilterGroup label={t.filterLanguage} variant="compact">
        {languages.map((code) => (
          <FilterChip
            key={code}
            label={t.languageNames[code]}
            selected={selectedLanguages.has(code)}
            onClick={() => onToggleLanguage(code)}
          />
        ))}
      </FilterGroup>

      <FilterGroup label={t.filterSort} variant="compact">
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
      </FilterGroup>

      {availableConcepts.length > 0 && (
        <FilterGroup
          label={t.filterConcepts}
          badge={selectedConcepts.size}
          variant="scroll"
          selectionKey={[...selectedConcepts].sort((a, b) => a - b).join(",")}
        >
          {availableConcepts.map((concept) => (
            <FilterChip
              key={concept.id}
              label={concept.name[language]}
              selected={selectedConcepts.has(concept.id)}
              onClick={() => onToggleConcept(concept.id)}
            />
          ))}
        </FilterGroup>
      )}
    </div>
  );
}
