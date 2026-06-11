import type { ProverbWithConcepts } from "../data/types";
import { ProverbCard } from "./ProverbCard";
import "./ProverbList.css";

interface ProverbListProps {
  proverbs: ProverbWithConcepts[];
  showLanguageBadges?: boolean;
}

export function ProverbList({ proverbs, showLanguageBadges = false }: ProverbListProps) {
  return (
    <ul className="proverb-list">
      {proverbs.map((proverb, index) => (
        <li
          key={proverb.id}
          className="proverb-list-item"
          style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
        >
          <ProverbCard proverb={proverb} showLanguageBadge={showLanguageBadges} />
        </li>
      ))}
    </ul>
  );
}
