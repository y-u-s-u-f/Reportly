export function SkeletonLine({ w = "100%", h = 12, className = "" }) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width: w, height: h }}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="rounded-3xl surface-0 border line p-4 flex flex-col gap-3">
      <div className="skeleton" style={{ height: 180, borderRadius: 20 }} />
      <div className="flex flex-col gap-2">
        <SkeletonLine w="70%" h={14} />
        <SkeletonLine w="45%" h={10} />
      </div>
    </div>
  );
}

export function SkeletonList({ n = 3 }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: n }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
