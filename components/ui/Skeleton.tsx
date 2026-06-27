interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`animate-pulse bg-white/10 rounded ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="p-4 rounded-xl border border-white/10 space-y-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-3 w-64" />
    </div>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr className="border-b border-white/10">
      <td className="px-4 py-3"><Skeleton className="h-3 w-28" /></td>
      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-3 w-32" /></td>
      <td className="px-4 py-3 hidden md:table-cell"><Skeleton className="h-3 w-48" /></td>
      <td className="px-4 py-3"><Skeleton className="h-5 w-20 rounded-full" /></td>
      <td className="px-4 py-3 hidden sm:table-cell"><Skeleton className="h-3 w-20" /></td>
      <td className="px-4 py-3"><Skeleton className="h-3 w-8" /></td>
    </tr>
  );
}
