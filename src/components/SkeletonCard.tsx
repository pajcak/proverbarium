import "./SkeletonCard.css";

/** Calm placeholder mirroring the proportions of a ProverbCard. */
export function SkeletonCard() {
  return (
    <div className="skeleton-card" aria-hidden="true">
      <div className="skeleton-line" style={{ width: "72%", height: 22 }} />
      <div className="skeleton-line" style={{ width: "94%", height: 14 }} />
      <div className="skeleton-line" style={{ width: "60%", height: 14 }} />
      <div className="skeleton-chips">
        <div className="skeleton-line skeleton-chip" />
        <div className="skeleton-line skeleton-chip" />
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }: { count?: number }) {
  return (
    <div className="skeleton-list">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
