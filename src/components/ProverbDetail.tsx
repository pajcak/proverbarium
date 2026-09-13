import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import type { ProverbWithConcepts } from "../data/types";
import "./ProverbDetail.css";

/**
 * Presentational detail view. Typography is the hero: the proverb in
 * headline-large, supporting sections in progressively softer contrast.
 */
export function ProverbDetail({ proverb }: { proverb: ProverbWithConcepts }) {
  const { language, t } = useI18n();

  return (
    <article className="proverb-detail" lang={proverb.languageCode}>
      <header className="detail-header">
        <p className="detail-language">{t.proverbLabel}</p>
        <h1 className="detail-text">{proverb.text}</h1>
      </header>

      <section className="detail-section detail-meaning" aria-label={t.meaning}>
        <h2 className="detail-label">{t.meaning}</h2>
        <p className="detail-meaning-text">{proverb.meaning}</p>
      </section>

      <section className="detail-section" aria-label={t.explanation}>
        <h2 className="detail-label">{t.explanation}</h2>
        <p className="detail-body">{proverb.explanation}</p>
      </section>

      <section className="detail-section" aria-label={t.exampleUsage}>
        <h2 className="detail-label">{t.exampleUsage}</h2>
        <blockquote className="detail-example">{proverb.example_usage}</blockquote>
      </section>

      <section className="detail-section" aria-label={t.origin}>
        <h2 className="detail-label">{t.origin}</h2>
        <p className="detail-body">{proverb.origin}</p>
      </section>

      {proverb.concepts.length > 0 && (
        <section className="detail-section" aria-label={t.concepts}>
          <h2 className="detail-label">{t.concepts}</h2>
          <ul className="detail-concepts">
            {proverb.concepts.map((concept, index) => (
              <li key={concept.id}>
                <Link
                  to={`/?topic=${concept.id}`}
                  className={
                    index === 0
                      ? "detail-concept-chip is-primary"
                      : "detail-concept-chip"
                  }
                >
                  {concept.name[language]}
                  <span className="concept-weight" aria-hidden="true">
                    {Math.round(concept.weight * 100)}&nbsp;%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </article>
  );
}
