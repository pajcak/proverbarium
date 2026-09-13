import type { LanguageCode } from "../data/types";

export interface Translation {
  appName: string;
  appTagline: string;
  heroTitle: string;
  heroSubtitle: string;
  searchPlaceholder: string;
  searchLabel: string;
  clearSearch: string;
  featuredProverbLabel: string;
  featuredProverbs: string;
  loadMore: string;
  loadingMore: string;
  searchResults: string;
  resultsCount: (n: number) => string;
  noResultsTitle: string;
  noResultsHint: string;
  filterLanguage: string;
  filterConcepts: string;
  filterSort: string;
  sortRelevance: string;
  sortAlphabetical: string;
  proverbLabel: string;
  meaning: string;
  explanation: string;
  exampleUsage: string;
  origin: string;
  concepts: string;
  similarProverbs: string;
  crossLanguageProverbs: string;
  crossLanguageSubtitle: string;
  backToHome: string;
  notFoundTitle: string;
  notFoundHint: string;
  skipToContent: string;
  switchLanguageLabel: string;
  footerNote: string;
  languageNames: Record<LanguageCode, string>;
}

export const TRANSLATIONS: Record<LanguageCode, Translation> = {
  cs: {
    appName: "Proverbarium",
    appTagline: "knihovna moudrosti",
    heroTitle: "Objevte moudrost generací",
    heroSubtitle: "Hledejte přísloví, významy a kulturní souvislosti.",
    searchPlaceholder: "Hledejte přísloví nebo popište situaci…",
    searchLabel: "Hledat přísloví",
    clearSearch: "Vymazat hledání",
    featuredProverbLabel: "Přísloví pro tuto chvíli",
    featuredProverbs: "Vybraná přísloví",
    loadMore: "Objevit další",
    loadingMore: "Načítání…",
    searchResults: "Výsledky hledání",
    resultsCount: (n) =>
      n === 1 ? "1 přísloví" : n >= 2 && n <= 4 ? `${n} přísloví` : `${n} přísloví`,
    noResultsTitle: "Nic jsme nenašli",
    noResultsHint: "Zkuste jiná slova, nebo popište situaci vlastními slovy.",
    filterLanguage: "Jazyk",
    filterConcepts: "Témata",
    filterSort: "Řazení",
    sortRelevance: "Podle relevance",
    sortAlphabetical: "Abecedně",
    proverbLabel: "Přísloví",
    meaning: "Význam",
    explanation: "Vysvětlení",
    exampleUsage: "Příklad použití",
    origin: "Původ",
    concepts: "Témata",
    similarProverbs: "Podobná přísloví",
    crossLanguageProverbs: "Moudrost jiných kultur",
    crossLanguageSubtitle: "Nejbližší příbuzná přísloví v dalších jazycích.",
    backToHome: "Zpět na přehled",
    notFoundTitle: "Přísloví nebylo nalezeno",
    notFoundHint: "Možná bylo přesunuto. Zkuste hledání na hlavní stránce.",
    skipToContent: "Přeskočit na obsah",
    switchLanguageLabel: "Přepnout jazyk",
    footerNote: "Digitální knihovna nadčasové moudrosti.",
    languageNames: { cs: "Čeština", en: "English" },
  },
  en: {
    appName: "Proverbarium",
    appTagline: "a library of wisdom",
    heroTitle: "Discover wisdom from generations",
    heroSubtitle: "Search proverbs, meanings, and cultural insights.",
    searchPlaceholder: "Search proverbs or describe a situation…",
    searchLabel: "Search proverbs",
    clearSearch: "Clear search",
    featuredProverbLabel: "A proverb for this moment",
    featuredProverbs: "Featured Proverbs",
    loadMore: "Discover more",
    loadingMore: "Loading…",
    searchResults: "Search results",
    resultsCount: (n) => (n === 1 ? "1 proverb" : `${n} proverbs`),
    noResultsTitle: "Nothing found",
    noResultsHint: "Try different words, or describe the situation in your own way.",
    filterLanguage: "Language",
    filterConcepts: "Concepts",
    filterSort: "Sort",
    sortRelevance: "By relevance",
    sortAlphabetical: "Alphabetical",
    proverbLabel: "Proverb",
    meaning: "Meaning",
    explanation: "Explanation",
    exampleUsage: "Example usage",
    origin: "Origin",
    concepts: "Concepts",
    similarProverbs: "Similar Proverbs",
    crossLanguageProverbs: "Related Wisdom From Other Cultures",
    crossLanguageSubtitle: "The conceptually closest proverbs in other languages.",
    backToHome: "Back to overview",
    notFoundTitle: "Proverb not found",
    notFoundHint: "It may have moved. Try searching from the home page.",
    skipToContent: "Skip to content",
    switchLanguageLabel: "Switch language",
    footerNote: "A digital library of timeless wisdom.",
    languageNames: { cs: "Čeština", en: "English" },
  },
};
