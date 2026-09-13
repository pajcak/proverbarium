# Proverbarium — a digital library of timeless wisdom

A premium web application for browsing and searching proverbs, with full
Czech/English internationalization and a Material Design 3 inspired design
system. Czech is the default language; switching to English swaps the UI
labels **and** the entire proverb collection — never a mixed-language
interface.

## Run it

```bash
npm install
npm run dev      # development server
npm run build    # type-check + production build
npm run preview  # serve the production build (service worker active)
```

## Architecture

```
src/
├── data/            # Backend contract
│   ├── types.ts     #   Language / Concept / Proverb / ProverbConcept schema
│   ├── mockData.ts  #   14 Czech + 14 English proverbs, concept links,
│   │                #   curated cross-language equivalent pairs
│   └── api.ts       #   async mock API (latency-simulated) — swap fetch() in
│                    #   later without touching any component
├── search/
│   └── searchEngine.ts  # full-text + fuzzy (edit distance, diacritics-
│                        # insensitive) + concept search; the scoring function
│                        # is the seam for a future semantic/embeddings backend
├── i18n/
│   ├── translations.ts  # UI string dictionaries (add a language = add a key)
│   └── I18nContext.tsx  # language state, persisted to localStorage
├── styles/
│   ├── tokens.css   # MD3 tokens: tonal surfaces, type scale, motion, shape
│   └── global.css   # reset, a11y, ripple, skeleton shimmer, transitions
├── components/      # AppLayout, TopAppBar, LanguageSwitcher, SearchHero,
│                    # FeaturedProverb, ProverbCard, ProverbList, FiltersBar,
│                    # ProverbDetail, SimilarProverbs, CrossLanguageProverbs,
│                    # SkeletonCard, ThemeProvider, AmbientBackground
├── hooks/           # useDebouncedValue (300ms search), useRipple (MD ripple)
└── pages/           # HomePage, ProverbDetailPage
```

## Design system

- **Colors** — muted blue-gray primary (`#4A5D73`), warm amber secondary
  (`#9A7026`), very light warm gray tonal surfaces. Light theme only;
  accents are rare and intentional.
- **Typography** — Inter with system fallbacks; the proverb text is always
  the hero, reading width capped at 60–70 characters.
- **Rhythm** — 64px between major sections, 24px between cards, 16px card
  padding, 16px card radius.
- **Motion** — 120ms card hover (lift −3px, scale 1.01), Material ripple on
  buttons and chips, fade + upward page transitions, fading search states.
  Everything respects `prefers-reduced-motion`.
- **Atmosphere** — two drifting blurred gradient blobs with gentle scroll
  parallax plus a soft noise texture, all below 5% opacity.

## UX behaviors

- Realtime search, debounced 300ms, across both languages; whole-phrase,
  token, prefix and fuzzy matches ranked by field weight (text > concepts >
  meaning > explanation > example).
- Filters (language, concepts, relevance/alphabetical) appear only after
  results exist — progressive disclosure. Chips scroll horizontally on
  mobile.
- The featured proverb under the search field quietly rotates every 9s.
- "Discover more" appends random proverbs from a stable per-session shuffle
  (no repeats).
- Detail page: Meaning → Explanation → Example → Origin → Concepts →
  Similar Proverbs → Related Wisdom From Other Cultures (curated CS ↔ EN
  equivalents ranked first, concept overlap after).
- Skeleton loading everywhere, semantic HTML, WCAG AA contrast, keyboard
  navigable, visible focus states, `aria-live` result counts, skip link.

## Offline / PWA

`public/sw.js` caches the app shell (network-first navigations, cache-first
assets) and `manifest.webmanifest` makes the app installable. The service
worker registers only in production builds.

## Extending

- **New language**: add a row to `LANGUAGES`, names to `Concept.name`,
  proverbs to `PROVERBS`, and a dictionary to `translations.ts`.
- **Real backend**: replace the bodies of the functions in `data/api.ts`.
- **Semantic search**: replace `scoreProverb` in `search/searchEngine.ts`
  (or move the whole `search()` call server-side).
