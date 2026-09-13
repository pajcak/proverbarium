import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import * as api from "../data/api";
import type {
  Concept,
  LanguageCode,
  ProverbWithConcepts,
  SearchResult,
} from "../data/types";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { useRipple } from "../hooks/useRipple";
import { useI18n } from "../i18n/I18nContext";
import { SearchHero } from "../components/SearchHero";
import { ProverbList } from "../components/ProverbList";
import { FiltersBar, type SortOrder } from "../components/FiltersBar";
import { SkeletonList } from "../components/SkeletonCard";
import "./HomePage.css";

const PAGE_SIZE = 6;

export function HomePage() {
  const { language, t } = useI18n();
  const ripple = useRipple();
  const [searchParams, setSearchParams] = useSearchParams();

  // ---- search state ----
  const [query, setQuery] = useState(() => searchParams.get("q") ?? "");
  const debouncedQuery = useDebouncedValue(query, 300);
  const trimmedQuery = debouncedQuery.trim();
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);

  // ---- filters (progressive disclosure — visible only with results) ----
  const [selectedLanguages, setSelectedLanguages] = useState<Set<LanguageCode>>(
    () => new Set<LanguageCode>(["cs", "en"]),
  );
  const [sort, setSort] = useState<SortOrder>("relevance");
  const [allConcepts, setAllConcepts] = useState<Concept[]>([]);

  // Selected topics live in the URL (?topic=3&topic=7): concept tags link
  // straight to a pre-selected filter, and the view stays shareable and
  // back-button safe.
  const topicParam = searchParams.getAll("topic").join(",");
  const selectedConcepts = useMemo<ReadonlySet<number>>(
    () =>
      new Set(
        topicParam
          .split(",")
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    [topicParam],
  );
  const topicKey = [...selectedConcepts].sort((a, b) => a - b).join(",");
  const chipToggleRef = useRef(false);
  const previousTopicKey = useRef(topicKey);

  // ---- browse state (random proverbs) ----
  const [browseItems, setBrowseItems] = useState<ProverbWithConcepts[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [browseLoading, setBrowseLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Keep the sharable URL in sync with typing. The ref guard makes sure this
  // only reacts to query changes — never to external URL changes (concept-chip
  // links, back/forward), which the adopting effect below handles.
  const lastTypedQuery = useRef(trimmedQuery);
  useEffect(() => {
    if (lastTypedQuery.current === trimmedQuery) return;
    lastTypedQuery.current = trimmedQuery;
    const current = searchParams.get("q") ?? "";
    if (current === trimmedQuery) return;
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (trimmedQuery) next.set("q", trimmedQuery);
        else next.delete("q");
        return next;
      },
      { replace: true },
    );
  }, [trimmedQuery, searchParams, setSearchParams]);

  // The reverse: a URL change while this page stays mounted updates the query.
  useEffect(() => {
    const urlQuery = searchParams.get("q") ?? "";
    setQuery((current) => {
      if (urlQuery === current.trim()) return current;
      lastTypedQuery.current = urlQuery;
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
      return urlQuery;
    });
  }, [searchParams]);

  // Load (and reload on language switch) the random browse collection.
  useEffect(() => {
    let cancelled = false;
    setBrowseLoading(true);
    api.listRandomProverbs(language, 0, PAGE_SIZE).then((page) => {
      if (cancelled) return;
      setBrowseItems(page.items);
      setHasMore(page.hasMore);
      setBrowseLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  // Concept names for selected topics that the current results may not contain.
  useEffect(() => {
    api.getConcepts().then(setAllConcepts);
  }, []);

  // A topic change from outside the filter bar (a concept tag, back/forward)
  // opens a fresh view at the top. Chip toggles set chipToggleRef first and
  // keep the page where it is. Without this, the brief skeleton state shrinks
  // the page and the browser clamps the scroll position mid-list.
  useEffect(() => {
    if (previousTopicKey.current === topicKey) return;
    previousTopicKey.current = topicKey;
    if (chipToggleRef.current) {
      chipToggleRef.current = false;
      return;
    }
    if (topicKey) {
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [topicKey]);

  // Results: a text query searches (topics then narrow it); without a query,
  // the selected topics themselves define the result set.
  const topicSource = trimmedQuery.length > 0 ? "" : topicKey;
  useEffect(() => {
    if (trimmedQuery.length === 0 && topicSource.length === 0) {
      setResults(null);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const request =
      trimmedQuery.length > 0
        ? api.search(trimmedQuery)
        : api.searchByConcepts(topicSource.split(",").map(Number));
    request.then((found) => {
      if (cancelled) return;
      setResults(found);
      setSearching(false);
    });
    return () => {
      cancelled = true;
    };
  }, [trimmedQuery, topicSource]);

  const loadMore = () => {
    setLoadingMore(true);
    api.listRandomProverbs(language, browseItems.length, PAGE_SIZE).then((page) => {
      setBrowseItems((items) => [...items, ...page.items]);
      setHasMore(page.hasMore);
      setLoadingMore(false);
    });
  };

  const toggleLanguage = (code: LanguageCode) => {
    setSelectedLanguages((current) => {
      const next = new Set(current);
      if (next.has(code)) {
        if (next.size > 1) next.delete(code);
      } else {
        next.add(code);
      }
      return next;
    });
  };

  const toggleConcept = (id: number) => {
    chipToggleRef.current = true;
    const next = new Set(selectedConcepts);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete("topic");
        for (const topicId of next) params.append("topic", String(topicId));
        return params;
      },
      { replace: true },
    );
  };

  const availableConcepts = useMemo<Concept[]>(() => {
    if (!results) return [];
    const byId = new Map<number, Concept>();
    for (const result of results) {
      for (const concept of result.proverb.concepts) {
        byId.set(concept.id, concept);
      }
    }
    // A selected topic must stay visible (and removable) even when the
    // current query's results don't contain it.
    for (const concept of allConcepts) {
      if (selectedConcepts.has(concept.id)) byId.set(concept.id, concept);
    }
    // Selected topics lead the list, the rest follow alphabetically.
    return [...byId.values()].sort(
      (a, b) =>
        Number(selectedConcepts.has(b.id)) - Number(selectedConcepts.has(a.id)) ||
        a.name[language].localeCompare(b.name[language], language),
    );
  }, [results, language, allConcepts, selectedConcepts]);

  const visibleResults = useMemo(() => {
    if (!results) return [];
    const filtered = results.filter((result) => {
      if (!selectedLanguages.has(result.proverb.languageCode)) return false;
      if (selectedConcepts.size > 0) {
        const hit = result.proverb.concepts.some((c) => selectedConcepts.has(c.id));
        if (!hit) return false;
      }
      return true;
    });
    if (sort === "alphabetical") {
      return [...filtered].sort((a, b) =>
        a.proverb.text.localeCompare(b.proverb.text, language),
      );
    }
    return filtered;
  }, [results, selectedLanguages, selectedConcepts, sort, language]);

  const isSearchMode = query.trim().length > 0 || selectedConcepts.size > 0;
  const showSearchSkeletons = isSearchMode && results === null;

  return (
    <>
      <SearchHero
        query={query}
        onQueryChange={setQuery}
        featuredPool={browseItems.slice(0, 5)}
        showFeatured={!isSearchMode}
      />

      <div className="container home-content">
        {isSearchMode ? (
          <section className="section" aria-labelledby="results-title">
            <div className="results-header">
              <h2 id="results-title" className="section-title">
                {t.searchResults}
              </h2>
              <p className="results-count" aria-live="polite" role="status">
                {results ? t.resultsCount(visibleResults.length) : t.loadingMore}
              </p>
            </div>

            {results && results.length > 0 && (
              <FiltersBar
                availableConcepts={availableConcepts}
                selectedConcepts={selectedConcepts}
                onToggleConcept={toggleConcept}
                selectedLanguages={selectedLanguages}
                onToggleLanguage={toggleLanguage}
                sort={sort}
                onSortChange={setSort}
              />
            )}

            {showSearchSkeletons ? (
              <SkeletonList count={3} />
            ) : visibleResults.length === 0 ? (
              <div className="empty-state">
                <p className="empty-state-title">{t.noResultsTitle}</p>
                <p className="empty-state-hint">{t.noResultsHint}</p>
              </div>
            ) : (
              <div className={`fade-swap${searching ? " is-fading" : ""}`}>
                <ProverbList
                  proverbs={visibleResults.map((result) => result.proverb)}
                  showLanguageBadges
                />
              </div>
            )}
          </section>
        ) : (
          <section className="section" aria-labelledby="featured-title">
            <h2 id="featured-title" className="section-title">
              {t.featuredProverbs}
            </h2>
            {browseLoading ? (
              <SkeletonList count={4} />
            ) : (
              <>
                <ProverbList proverbs={browseItems} />
                {hasMore && (
                  <div className="load-more-wrap">
                    <button
                      type="button"
                      className="load-more ripple-host"
                      onPointerDown={ripple}
                      onClick={loadMore}
                      disabled={loadingMore}
                    >
                      {loadingMore ? t.loadingMore : t.loadMore}
                    </button>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </div>
    </>
  );
}
