import { useI18n } from "../i18n/I18nContext";
import type { ProverbWithConcepts } from "../data/types";
import { ProverbList } from "./ProverbList";

export function CrossLanguageProverbs({ proverbs }: { proverbs: ProverbWithConcepts[] }) {
  const { t } = useI18n();
  if (proverbs.length === 0) return null;

  return (
    <section className="section" aria-labelledby="cross-language-title">
      <h2 id="cross-language-title" className="section-title">
        {t.crossLanguageProverbs}
      </h2>
      <p className="section-subtitle">{t.crossLanguageSubtitle}</p>
      <ProverbList proverbs={proverbs} showLanguageBadges />
    </section>
  );
}
