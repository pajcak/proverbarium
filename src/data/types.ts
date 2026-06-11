/**
 * Domain types for the static, concept-centric data source
 * (src/data/proverbs.json, maintained by scripts/add-proverb.mjs).
 *
 * Concept is the core entity; proverbs are language-specific expressions
 * of concepts, linked with weights in [0, 1] (1 = primary concept).
 */

export type LanguageCode = "cs" | "en";

export interface Concept {
  id: number;
  name: Record<LanguageCode, string>;
}

/** A concept resolved onto a proverb, carrying the link weight. */
export interface WeightedConcept extends Concept {
  weight: number;
}

/** Proverb as stored in proverbs.json. */
export interface SourceProverb {
  id: string;
  language: LanguageCode;
  text: string;
  meaning: string;
  explanation: string;
  example_usage: string;
  origin: string;
  /** Weighted concept links, sorted by weight — the first is the primary. */
  concepts: Array<{ id: number; weight: number }>;
}

/** Cross-language equivalence computed (or curated) by the add script. */
export interface Equivalent {
  a: string;
  b: string;
  score: number;
  manual?: boolean;
}

export interface SourceData {
  concepts: Concept[];
  proverbs: SourceProverb[];
  equivalents: Equivalent[];
}

/** A proverb with resolved concepts — the shape the UI consumes. */
export interface ProverbWithConcepts {
  id: string;
  languageCode: LanguageCode;
  text: string;
  meaning: string;
  explanation: string;
  example_usage: string;
  origin: string;
  /** Sorted by weight descending; the first concept is the primary one. */
  concepts: WeightedConcept[];
}

export interface SearchResult {
  proverb: ProverbWithConcepts;
  score: number;
}
