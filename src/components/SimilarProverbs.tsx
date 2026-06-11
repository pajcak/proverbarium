import { useI18n } from "../i18n/I18nContext";
import type { ProverbWithConcepts } from "../data/types";
import { ProverbList } from "./ProverbList";

export function SimilarProverbs({ proverbs }: { proverbs: ProverbWithConcepts[] }) {
  const { t } = useI18n();
  if (proverbs.length === 0) return null;

  return (
    <section className="section" aria-labelledby="similar-title">
      <h2 id="similar-title" className="section-title">
        {t.similarProverbs}
      </h2>
      <ProverbList proverbs={proverbs} />
    </section>
  );
}
