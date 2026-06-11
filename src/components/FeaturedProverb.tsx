import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useI18n } from "../i18n/I18nContext";
import type { ProverbWithConcepts } from "../data/types";
import "./FeaturedProverb.css";

const ROTATE_INTERVAL_MS = 9000;
const FADE_MS = 260;

/**
 * One featured proverb under the search field. It quietly rotates to create
 * gentle novelty — a fade out, a swap, a fade in.
 */
export function FeaturedProverb({ proverbs }: { proverbs: ProverbWithConcepts[] }) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [proverbs]);

  useEffect(() => {
    if (proverbs.length < 2) return;
    const timer = window.setInterval(() => {
      setFading(true);
      window.setTimeout(() => {
        setIndex((current) => (current + 1) % proverbs.length);
        setFading(false);
      }, FADE_MS);
    }, ROTATE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [proverbs]);

  const proverb = proverbs[index];
  if (!proverb) {
    return <div className="featured-proverb featured-proverb-placeholder" />;
  }

  return (
    <div className="featured-proverb">
      <span className="featured-proverb-label">{t.featuredProverbLabel}</span>
      <Link
        to={`/proverb/${proverb.id}`}
        className={`featured-proverb-text fade-swap${fading ? " is-fading" : ""}`}
      >
        <span aria-hidden="true">✨ </span>
        {proverb.text}
      </Link>
    </div>
  );
}
