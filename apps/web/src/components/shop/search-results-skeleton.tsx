'use client';

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-mn-border bg-white">
      <div className="aspect-[4/5] skeleton" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-4 w-1/2 skeleton rounded" />
        <div className="h-5 w-1/3 skeleton rounded" />
      </div>
    </div>
  );
}

export function SearchResultsSkeleton() {
  return (
    <div className="animate-fade-in">
      <div className="mb-4 h-4 w-32 skeleton rounded" />

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index}>
            <SkeletonCard />
          </div>
        ))}
      </div>
    </div>
  );
}
