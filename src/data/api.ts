import sourceData from "./proverbs.json";
import type {
  Concept,
  LanguageCode,
  ProverbWithConcepts,
  SearchResult,
  SourceData,
  WeightedConcept,
} from "./types";
import { buildIndex, searchProverbs } from "../search/searchEngine";

/**
 * Static data layer over src/data/proverbs.json — the single source of
 * proverbs, maintained by scripts/add-proverb.mjs. Every function stays
 * async so a real backend could be swapped in without component changes.
 *
 * Similarity is concept-based: proverbs cluster through their weighted
 * concept links, and cross-language matches come from concept overlap —
 * never from translation.
 */

const DATA = sourceData as SourceData;

const LATENCY_MS = 350;

function delay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), LATENCY_MS));
}

const conceptById = new Map<number, Concept>(DATA.concepts.map((c) => [c.id, c]));

const ALL_PROVERBS: ProverbWithConcepts[] = DATA.proverbs.map((proverb) => ({
  id: proverb.id,
  languageCode: proverb.language,
  text: proverb.text,
  meaning: proverb.meaning,
  explanation: proverb.explanation,
  example_usage: proverb.example_usage,
  origin: proverb.origin,
  concepts: proverb.concepts
    .map((link) => {
      const concept = conceptById.get(link.id);
      return concept ? { ...concept, weight: link.weight } : null;
    })
    .filter((c): c is WeightedConcept => c !== null)
    .sort((a, b) => b.weight - a.weight),
}));

const proverbById = new Map(ALL_PROVERBS.map((p) => [p.id, p]));
const searchIndex = buildIndex(ALL_PROVERBS);

/** Curated/computed cross-language equivalents with their scores. */
const equivalentOf = new Map<string, { id: string; score: number }>();
for (const eq of DATA.equivalents) {
  equivalentOf.set(eq.a, { id: eq.b, score: eq.score });
  equivalentOf.set(eq.b, { id: eq.a, score: eq.score });
}

/**
 * Weighted concept overlap: Σ shared link weights / Σ all link weights.
 * Identical concept profiles score 1, disjoint profiles score 0.
 */
function conceptOverlap(a: ProverbWithConcepts, b: ProverbWithConcepts): number {
  const idsA = new Set(a.concepts.map((c) => c.id));
  const idsB = new Set(b.concepts.map((c) => c.id));
  let shared = 0;
  let total = 0;
  for (const { id, weight } of a.concepts) {
    total += weight;
    if (idsB.has(id)) shared += weight;
  }
  for (const { id, weight } of b.concepts) {
    total += weight;
    if (idsA.has(id)) shared += weight;
  }
  return total === 0 ? 0 : shared / total;
}

/** Stable per-session shuffle so "load more" never repeats a card. */
const sessionSeed = Math.floor(Math.random() * 0xffffff);

function seededShuffle<T>(items: T[], seed: number): T[] {
  const result = [...items];
  let state = seed || 1;
  for (let i = result.length - 1; i > 0; i--) {
    state = (state * 1664525 + 1013904223) % 0x100000000;
    const j = state % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const shuffledByLanguage = new Map<LanguageCode, ProverbWithConcepts[]>();
function shuffledFor(code: LanguageCode): ProverbWithConcepts[] {
  let list = shuffledByLanguage.get(code);
  if (!list) {
    list = seededShuffle(
      ALL_PROVERBS.filter((p) => p.languageCode === code),
      sessionSeed,
    );
    shuffledByLanguage.set(code, list);
  }
  return list;
}

// ---------------------------------------------------------------- public API

export function getConcepts(): Promise<Concept[]> {
  return delay(DATA.concepts);
}

export interface ProverbPage {
  items: ProverbWithConcepts[];
  hasMore: boolean;
}

export function listRandomProverbs(
  code: LanguageCode,
  offset: number,
  limit: number,
): Promise<ProverbPage> {
  const pool = shuffledFor(code);
  return delay({
    items: pool.slice(offset, offset + limit),
    hasMore: offset + limit < pool.length,
  });
}

export function getFeaturedPool(code: LanguageCode): Promise<ProverbWithConcepts[]> {
  return delay(shuffledFor(code).slice(0, 6));
}

export function getProverb(id: string): Promise<ProverbWithConcepts | null> {
  return delay(proverbById.get(id) ?? null);
}

export function search(query: string): Promise<SearchResult[]> {
  return delay(searchProverbs(searchIndex, query));
}

/**
 * Every proverb (all languages) linked to any of the given concepts, strongest
 * link first — the result set behind a topic filter.
 */
export function searchByConcepts(conceptIds: number[]): Promise<SearchResult[]> {
  const wanted = new Set(conceptIds);
  const results = ALL_PROVERBS.map((proverb) => ({
    proverb,
    score: Math.max(
      0,
      ...proverb.concepts.filter((c) => wanted.has(c.id)).map((c) => c.weight),
    ),
  }))
    .filter((result) => result.score > 0)
    .sort((a, b) => b.score - a.score || a.proverb.text.localeCompare(b.proverb.text));
  return delay(results);
}

/** Same-language neighbors, ranked by weighted concept overlap. */
export function getSimilarProverbs(id: string, limit = 4): Promise<ProverbWithConcepts[]> {
  const source = proverbById.get(id);
  if (!source) return delay([]);
  const similar = ALL_PROVERBS.filter(
    (p) => p.id !== id && p.languageCode === source.languageCode,
  )
    .map((p) => ({ proverb: p, score: conceptOverlap(source, p) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.proverb);
  return delay(similar);
}

/**
 * Cross-language counterparts: the stored equivalent (if any) always ranks
 * first, then other-language proverbs by weighted concept overlap.
 */
export function getCrossLanguageProverbs(
  id: string,
  limit = 3,
): Promise<ProverbWithConcepts[]> {
  const source = proverbById.get(id);
  if (!source) return delay([]);
  const equivalent = equivalentOf.get(id);
  const matches = ALL_PROVERBS.filter((p) => p.languageCode !== source.languageCode)
    .map((p) => ({
      proverb: p,
      score:
        conceptOverlap(source, p) +
        (equivalent && p.id === equivalent.id ? 10 * equivalent.score : 0),
    }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.proverb);
  return delay(matches);
}
