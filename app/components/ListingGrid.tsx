import type { ReactNode } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// One responsive grid for every list of listings
const gridClass =
  "grid grid-cols-1 gap-x-6 gap-y-10 min-[520px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5";

export function ListingGrid({ children }: { children: ReactNode }) {
  return <div className={gridClass}>{children}</div>;
}

// Loading screen for list pages (favorites, my listings, reservations)
export function ListingPageSkeleton() {
  return (
    <div className="page-container">
      <div className="pb-8 pt-8 sm:pt-12">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="mt-3 h-4 w-72" />
      </div>
      <ListingGridSkeleton />
    </div>
  );
}

export function ListingGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className={gridClass} aria-busy aria-label="Loading listings">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[5/4] w-full rounded-2xl" />
          <Skeleton className="mt-3 h-4 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />
          <Skeleton className="mt-3 h-4 w-1/3" />
        </div>
      ))}
    </div>
  );
}
