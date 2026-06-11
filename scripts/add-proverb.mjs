#!/usr/bin/env node
/**
 * Maintains the single proverb source: src/data/proverbs.json — adds new
 * proverbs and recomputes concept weights + cross-language equivalents.
 * Full manual: scripts/README.md
 */

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const DATA_PATH = resolve(dirname(fileURLToPath(import.meta.url)), "../src/data/proverbs.json");

const DIMENSION = 256;
const LANGUAGES = ["cs", "en"];
/** Auto-assignment: keep centroids within this fraction of the best match. */
const AUTO_CONCEPT_RATIO = 0.6;
const MAX_AUTO_CONCEPTS = 3;
/** Cross-language pairs below this score are not stored. */
const EQUIVALENT_THRESHOLD = 0.5;

// ---------------------------------------------------------------- embedding
// FNV-1a feature hashing: word unigrams (weight 2) + char trigrams (weight 1),
// L2-normalized. Deterministic, diacritics-insensitive, dependency-free.

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(new RegExp("[\\u0300-\\u036f]", "g"), "")
    .replace(/[^a-z0-9\s]/g, " ");
}

function fnv1a(token) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < token.length; i++) {
    hash ^= token.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0) % DIMENSION;
}

function embed(text) {
  const vector = new Array(DIMENSION).fill(0);
  const words = normalizeText(text).split(/\s+/).filter((w) => w.length > 1);
  for (const word of words) {
    vector[fnv1a(word)] += 2;
    const padded = `_${word}_`;
    for (let i = 0; i + 3 <= padded.length; i++) {
      vector[fnv1a(padded.slice(i, i + 3))] += 1;
    }
  }
  const norm = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  return norm === 0 ? vector : vector.map((v) => v / norm);
}

function cosine(a, b) {
  let dot = 0;
  for (let i = 0; i < DIMENSION; i++) dot += a[i] * b[i];
  return dot; // vectors are pre-normalized
}

function proverbVector(proverb) {
  return embed(`${proverb.text} ${proverb.meaning} ${proverb.explanation}`);
}

// ------------------------------------------------------------ derived state

function conceptCentroids(data, vectors) {
  const centroids = new Map();
  for (const concept of data.concepts) {
    const members = data.proverbs.filter((p) => p.concepts.some((c) => c.id === concept.id));
    if (members.length === 0) continue;
    const mean = new Array(DIMENSION).fill(0);
    for (const member of members) {
      const v = vectors.get(member.id);
      for (let i = 0; i < DIMENSION; i++) mean[i] += v[i];
    }
    const norm = Math.sqrt(mean.reduce((sum, v) => sum + v * v, 0));
    centroids.set(concept.id, norm === 0 ? mean : mean.map((v) => v / norm));
  }
  return centroids;
}

/** Weights = cosine to each linked concept's centroid, scaled so primary = 1. */
function recomputeWeights(data, vectors, centroids) {
  for (const proverb of data.proverbs) {
    const v = vectors.get(proverb.id);
    for (const link of proverb.concepts) {
      const centroid = centroids.get(link.id);
      link.weight = centroid ? Math.max(0.05, cosine(v, centroid)) : 0.05;
    }
    const max = Math.max(...proverb.concepts.map((c) => c.weight));
    for (const link of proverb.concepts) {
      link.weight = Math.round((link.weight / max) * 100) / 100;
    }
    proverb.concepts.sort((a, b) => b.weight - a.weight || a.id - b.id);
  }
}

/** Weighted concept overlap: Σ shared weights / Σ all weights (both sides). */
function conceptOverlap(a, b) {
  const weightsB = new Map(b.concepts.map((c) => [c.id, c.weight]));
  const weightsA = new Map(a.concepts.map((c) => [c.id, c.weight]));
  let shared = 0;
  let total = 0;
  for (const { id, weight } of a.concepts) {
    total += weight;
    if (weightsB.has(id)) shared += weight;
  }
  for (const { id, weight } of b.concepts) {
    total += weight;
    if (weightsA.has(id)) shared += weight;
  }
  return total === 0 ? 0 : shared / total;
}

/**
 * Cross-language equivalents: for each proverb keep its best other-language
 * match by 0.7·conceptOverlap + 0.3·cosine. Manual pairs are kept as-is.
 */
function recomputeEquivalents(data, vectors) {
  const manual = (data.equivalents ?? []).filter((eq) => eq.manual);
  const paired = new Set(manual.flatMap((eq) => [eq.a, eq.b]));
  const computed = new Map();

  for (const a of data.proverbs) {
    if (paired.has(a.id)) continue;
    let best = null;
    for (const b of data.proverbs) {
      if (b.language === a.language || paired.has(b.id)) continue;
      const score = 0.7 * conceptOverlap(a, b) + 0.3 * cosine(vectors.get(a.id), vectors.get(b.id));
      if (score >= EQUIVALENT_THRESHOLD && (!best || score > best.score)) {
        best = { b: b.id, score };
      }
    }
    if (!best) continue;
    const key = [a.id, best.b].sort().join("::");
    const existing = computed.get(key);
    if (!existing || best.score > existing.score) {
      computed.set(key, { a: a.id, b: best.b, score: Math.round(best.score * 100) / 100 });
    }
  }
  data.equivalents = [...manual, ...computed.values()].sort((x, y) => x.a.localeCompare(y.a));
}

function rebuild(data) {
  const vectors = new Map(data.proverbs.map((p) => [p.id, proverbVector(p)]));
  const centroids = conceptCentroids(data, vectors);
  recomputeWeights(data, vectors, centroids);
  recomputeEquivalents(data, vectors);
  return { vectors, centroids };
}

// -------------------------------------------------------------- adding new

function findConcept(data, name) {
  const needle = normalizeText(name).trim();
  return data.concepts.find((c) =>
    LANGUAGES.some((lang) => normalizeText(c.name[lang]).trim() === needle),
  );
}

function resolveConcepts(data, entries, text) {
  const ids = [];
  for (const entry of entries) {
    if (typeof entry === "object" && entry.cs && entry.en) {
      const existing = findConcept(data, entry.cs) ?? findConcept(data, entry.en);
      if (existing) {
        ids.push(existing.id);
        continue;
      }
      const id = Math.max(...data.concepts.map((c) => c.id)) + 1;
      data.concepts.push({ id, name: { cs: entry.cs, en: entry.en } });
      console.log(`  + new concept #${id}: ${entry.cs} / ${entry.en}`);
      ids.push(id);
      continue;
    }
    const concept = findConcept(data, String(entry));
    if (!concept) {
      const known = data.concepts.map((c) => `${c.name.cs}/${c.name.en}`).join(", ");
      throw new Error(
        `Unknown concept "${entry}" for "${text}".\n` +
          `Known concepts: ${known}\n` +
          `Use { "cs": "...", "en": "..." } to create a new one.`,
      );
    }
    ids.push(concept.id);
  }
  return [...new Set(ids)];
}

function autoConcepts(data, vector, centroids) {
  const scored = [...centroids.entries()]
    .map(([id, centroid]) => ({ id, score: cosine(vector, centroid) }))
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) throw new Error("No concept centroids — seed concepts first.");
  const best = scored[0].score;
  return scored
    .filter((entry, index) => index === 0 || entry.score >= best * AUTO_CONCEPT_RATIO)
    .slice(0, MAX_AUTO_CONCEPTS)
    .map((entry) => entry.id);
}

function nextId(data, language) {
  const max = data.proverbs
    .filter((p) => p.language === language)
    .reduce((acc, p) => Math.max(acc, Number(p.id.split("-")[1]) || 0), 0);
  return `${language}-${String(max + 1).padStart(2, "0")}`;
}

function addProverbs(data, inputs) {
  const { centroids } = rebuild(data); // fresh centroids for auto-assignment

  for (const input of inputs) {
    for (const field of ["language", "text", "meaning", "explanation"]) {
      if (!input[field]) throw new Error(`Missing "${field}" in: ${JSON.stringify(input)}`);
    }
    if (!LANGUAGES.includes(input.language)) {
      throw new Error(`Unknown language "${input.language}" (expected: ${LANGUAGES.join(", ")})`);
    }
    if (data.proverbs.some((p) => p.text === input.text)) {
      console.log(`  ~ skipped (already exists): ${input.text}`);
      continue;
    }

    const proverb = {
      id: nextId(data, input.language),
      language: input.language,
      text: input.text,
      meaning: input.meaning,
      explanation: input.explanation,
      example_usage: input.example_usage ?? "",
      origin: input.origin ?? "",
      concepts: [],
    };
    const conceptIds = input.concepts?.length
      ? resolveConcepts(data, input.concepts, input.text)
      : autoConcepts(data, proverbVector(proverb), centroids);
    proverb.concepts = conceptIds.map((id) => ({ id, weight: 1 }));
    data.proverbs.push(proverb);

    const names = conceptIds
      .map((id) => data.concepts.find((c) => c.id === id)?.name[input.language])
      .join(", ");
    console.log(`  + ${proverb.id}: ${proverb.text}  [${names}]`);
  }

  rebuild(data); // final weights + equivalents include the new proverbs
}

// --------------------------------------------------------------------- main

const arg = process.argv[2];
if (!arg) {
  console.error("Usage: node scripts/add-proverb.mjs <new-proverbs.json> | --rebuild");
  process.exit(1);
}

const data = JSON.parse(readFileSync(DATA_PATH, "utf8"));

if (arg === "--rebuild") {
  rebuild(data);
  console.log(`Recomputed weights for ${data.proverbs.length} proverbs, ${data.equivalents.length} equivalents.`);
} else {
  const parsed = JSON.parse(readFileSync(resolve(arg), "utf8"));
  const inputs = Array.isArray(parsed) ? parsed : [parsed];
  console.log(`Adding ${inputs.length} proverb(s)…`);
  addProverbs(data, inputs);
}

writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`Saved ${DATA_PATH} (${data.proverbs.length} proverbs, ${data.concepts.length} concepts, ${data.equivalents.length} equivalents).`);
