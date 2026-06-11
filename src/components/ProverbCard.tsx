import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import type { ProverbWithConcepts } from "../data/types";
import "./ProverbCard.css";

interface ProverbCardProps {
  proverb: ProverbWithConcepts;
  showLanguageBadge?: boolean;
}

/**
 * Stretched-link card: the proverb link covers the whole card via an
 * ::after overlay, while concept chips sit above it as their own links
 * to a search for that concept.
 */
export function ProverbCard({ proverb, showLanguageBadge = false }: ProverbCardProps) {
  const { language, t } = useI18n();

  return (
    <article className="proverb-card" lang={proverb.languageCode}>
      {showLanguageBadge && (
        <span className="proverb-card-badge">
          {t.languageNames[proverb.languageCode]}
        </span>
      )}
      <h3 className="proverb-card-text">
        <Link to={`/proverb/${proverb.id}`} className="proverb-card-main-link">
          {proverb.text}
        </Link>
      </h3>
      <p className="proverb-card-meaning">{proverb.meaning}</p>
      {proverb.concepts.length > 0 && (
        <ul className="proverb-card-concepts" aria-label={t.concepts}>
          {proverb.concepts.map((concept) => (
            <li key={concept.id}>
              <Link
                to={`/?q=${encodeURIComponent(concept.name[language])}`}
                className="concept-tag"
              >
                {concept.name[language]}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
