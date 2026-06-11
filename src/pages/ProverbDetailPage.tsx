import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import * as api from "../data/api";
import type { ProverbWithConcepts } from "../data/types";
import { useI18n } from "../i18n/I18nContext";
import { ProverbDetail } from "../components/ProverbDetail";
import { SimilarProverbs } from "../components/SimilarProverbs";
import { CrossLanguageProverbs } from "../components/CrossLanguageProverbs";
import "./ProverbDetailPage.css";

function DetailSkeleton() {
  return (
    <div aria-hidden="true">
      <div className="skeleton-line" style={{ width: "30%", height: 14 }} />
      <div
        className="skeleton-line"
        style={{ width: "85%", height: 36, marginTop: 20 }}
      />
      <div
        className="skeleton-line"
        style={{ width: "100%", height: 88, marginTop: 40, borderRadius: 16 }}
      />
      <div
        className="skeleton-line"
        style={{ width: "95%", height: 16, marginTop: 40 }}
      />
      <div className="skeleton-line" style={{ width: "88%", height: 16, marginTop: 12 }} />
      <div className="skeleton-line" style={{ width: "60%", height: 16, marginTop: 12 }} />
    </div>
  );
}

export function ProverbDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useI18n();
  const [proverb, setProverb] = useState<ProverbWithConcepts | null>(null);
  const [similar, setSimilar] = useState<ProverbWithConcepts[]>([]);
  const [crossLanguage, setCrossLanguage] = useState<ProverbWithConcepts[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setProverb(null);
    setSimilar([]);
    setCrossLanguage([]);
    Promise.all([
      api.getProverb(id),
      api.getSimilarProverbs(id),
      api.getCrossLanguageProverbs(id),
    ]).then(([loaded, similarFound, crossFound]) => {
      if (cancelled) return;
      setProverb(loaded);
      setSimilar(similarFound);
      setCrossLanguage(crossFound);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    document.title = proverb
      ? `${proverb.text} — ${t.appName}`
      : `${t.appName} — ${t.appTagline}`;
    return () => {
      document.title = `${t.appName} — ${t.appTagline}`;
    };
  }, [proverb, t]);

  return (
    <div className="container detail-page">
      <Link to="/" className="back-link">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
          <path
            d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2Z"
            fill="currentColor"
          />
        </svg>
        {t.backToHome}
      </Link>

      {loading ? (
        <DetailSkeleton />
      ) : proverb ? (
        <>
          <ProverbDetail proverb={proverb} />
          <SimilarProverbs proverbs={similar} />
          <CrossLanguageProverbs proverbs={crossLanguage} />
        </>
      ) : (
        <div className="empty-state">
          <p className="empty-state-title">{t.notFoundTitle}</p>
          <p className="empty-state-hint">{t.notFoundHint}</p>
        </div>
      )}
    </div>
  );
}
