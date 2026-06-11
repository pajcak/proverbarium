# add-proverb.mjs

Maintains the single proverb source: `src/data/proverbs.json`. Concept is the
core entity — proverbs are language-specific expressions of concepts. The
script computes everything derived from that idea: per-proverb concept
weights and cross-language equivalents. Plain Node, no dependencies.

## Usage

```bash
node scripts/add-proverb.mjs <new-proverbs.json>   # add proverb(s)
node scripts/add-proverb.mjs --rebuild             # recompute all weights + equivalents
```

After any change, rebuild the app (`npm run build`) and re-upload `dist/`.

## Input file

One object or an array of objects (see `example-proverb.json`):

```json
{
  "language": "cs",
  "text": "Pozdě bycha honiti.",
  "meaning": "Litovat po činu je zbytečné.",
  "explanation": "Jakmile se rozhodnutí stane, výčitky už nic nezmění.",
  "example_usage": "„Měl jsem to auto pojistit. Pozdě bycha honiti.“",
  "origin": "Staročeské rčení.",
  "concepts": ["Důsledky", { "cs": "Lítost", "en": "Regret" }]
}
```

`language`, `text`, `meaning` and `explanation` are required;
`example_usage`, `origin` and `concepts` are optional.

## Concepts

Entries in `concepts` are resolved like this:

- **A string** (`"Důsledky"`) must match an existing concept name in either
  language. An unknown name is an error — the script lists all known
  concepts. This is deliberate: a typo should fail loudly rather than
  silently create a duplicate concept.
- **An object** (`{ "cs": "Lítost", "en": "Regret" }`) creates a new concept
  with the next free id — unless either name already exists, in which case
  the existing concept is reused.
- **Omitted entirely** → automatic assignment. The proverb's
  `text + meaning + explanation` is embedded into a 256-dimension vector
  (feature hashing of words and character trigrams). Each concept has a
  centroid — the normalized mean of its member proverbs' vectors. The script
  keeps the best-matching centroid by cosine similarity, plus any others
  scoring at least 60 % of the best match, capped at 3. The embedding is
  lexical (shared words, not true meaning), so explicit concept names are
  always more reliable; auto mode is the convenience fallback.

The first/highest-weighted concept of a proverb is its **primary** concept.

## What a run recomputes — and what it never touches

Every run (add or `--rebuild`) refreshes **all derived numbers** across the
whole dataset, because centroids shift when the data grows:

- concept link **weights** of every proverb (cosine to the concept centroid,
  scaled so the primary concept = 1),
- computed **cross-language equivalents**
  (0.7 · concept overlap + 0.3 · cosine, stored when ≥ 0.5). Pairs marked
  `"manual": true` in `proverbs.json` are always kept as-is.

It never changes **which** concepts an existing proverb is linked to.
A brand-new concept therefore starts with exactly one member — the proverb
that created it. Auto-relinking the whole collection on every new concept
would silently churn the curated taxonomy.

## Adding an existing proverb to a (new) concept

Concept memberships are curated by hand:

1. Open `src/data/proverbs.json`.
2. Find the proverb and add a link to its `concepts` array — the weight is a
   placeholder, the rebuild computes the real one:

   ```json
   "concepts": [
     { "id": 9, "weight": 1 },
     { "id": 11, "weight": 1 }
   ]
   ```

3. Run `node scripts/add-proverb.mjs --rebuild` — all weights and
   equivalents are recalculated, including the ones your edit affected.
