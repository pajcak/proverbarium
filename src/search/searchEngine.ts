import type { ProverbWithConcepts, SearchResult } from "../data/types";

/**
 * Lightweight client-side search engine:
 *  - full-text matching across text, meaning, explanation and example
 *  - fuzzy token matching (edit distance, diacritics-insensitive)
 *  - concept matching ("describe a situation" queries often hit concepts)
 *
 * The scoring pipeline is deliberately shaped like a ranking function so a
 * future semantic backend (embeddings) can replace `scoreProverb` without
 * touching the UI.
 */

const COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");

export function normalize(value: string): string {
  return value.toLowerCase().normalize("NFD").replace(COMBINING_MARKS, "");
}

function tokenize(value: string): string[] {
  return normalize(value)
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 1);
}

/** Levenshtein distance with early exit once `max` is exceeded. */
function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array<number>(b.length + 1);
  const curr = new Array<number>(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, curr[j]);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

function fuzzyThreshold(token: string): number {
  if (token.length >= 7) return 2;
  if (token.length >= 4) return 1;
  return 0;
}

/** How well does a query token match any token of the field? */
function tokenFieldScore(queryToken: string, fieldTokens: string[]): number {
  let best = 0;
  for (const fieldToken of fieldTokens) {
    if (fieldToken === queryToken) return 1;
    if (fieldToken.startsWith(queryToken) && queryToken.length >= 3) {
      best = Math.max(best, 0.85);
      continue;
    }
    const max = fuzzyThreshold(queryToken);
    if (max > 0 && editDistance(queryToken, fieldToken, max) <= max) {
      best = Math.max(best, 0.6);
    }
  }
  return best;
}

interface IndexedProverb {
  proverb: ProverbWithConcepts;
  textNorm: string;
  textTokens: string[];
  meaningTokens: string[];
  explanationTokens: string[];
  exampleTokens: string[];
  conceptTokens: string[];
}

export function buildIndex(proverbs: ProverbWithConcepts[]): IndexedProverb[] {
  return proverbs.map((proverb) => ({
    proverb,
    textNorm: normalize(proverb.text),
    textTokens: tokenize(proverb.text),
    meaningTokens: tokenize(proverb.meaning),
    explanationTokens: tokenize(proverb.explanation),
    exampleTokens: tokenize(proverb.example_usage),
    conceptTokens: proverb.concepts.flatMap((concept) =>
      Object.values(concept.name).flatMap(tokenize),
    ),
  }));
}

const FIELD_WEIGHTS = {
  text: 30,
  concept: 22,
  meaning: 12,
  explanation: 6,
  example: 4,
} as const;

function scoreProverb(entry: IndexedProverb, queryNorm: string, queryTokens: string[]): number {
  let score = 0;

  // Whole-phrase hit in the proverb text dominates everything else.
  if (queryNorm.length >= 4 && entry.textNorm.includes(queryNorm)) {
    score += 100;
  }

  let matchedTokens = 0;
  for (const token of queryTokens) {
    const text = tokenFieldScore(token, entry.textTokens) * FIELD_WEIGHTS.text;
    const concept = tokenFieldScore(token, entry.conceptTokens) * FIELD_WEIGHTS.concept;
    const meaning = tokenFieldScore(token, entry.meaningTokens) * FIELD_WEIGHTS.meaning;
    const explanation =
      tokenFieldScore(token, entry.explanationTokens) * FIELD_WEIGHTS.explanation;
    const example = tokenFieldScore(token, entry.exampleTokens) * FIELD_WEIGHTS.example;
    const tokenScore = Math.max(text, concept) + meaning + explanation + example;
    if (tokenScore > 0) matchedTokens += 1;
    score += tokenScore;
  }

  // "Describe a situation" queries: reward matching most of the query.
  if (queryTokens.length > 1 && matchedTokens > 0) {
    score *= matchedTokens / queryTokens.length;
  }

  return score;
}

export function searchProverbs(
  index: IndexedProverb[],
  query: string,
): SearchResult[] {
  const queryNorm = normalize(query.trim());
  const queryTokens = tokenize(query);
  if (queryNorm.length === 0) return [];

  return index
    .map((entry) => ({
      proverb: entry.proverb,
      score: scoreProverb(entry, queryNorm, queryTokens),
    }))
    .filter((result) => result.score >= 8)
    .sort((a, b) => b.score - a.score);
}
