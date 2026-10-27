import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { formatPrice, getImageUrl } from "@/lib/utils";

export interface ListingCardShellProps {
  listingId: string;
  imagePath: string;
  title: string;
  subtitle?: string;
  price: number;
  // Floating control in the photo's top-right corner (heart, menu)
  action?: ReactNode;
}

// Shared look of every listing card (home, search, favorites, my listings)
export function ListingCardShell({ listingId, imagePath, title, subtitle, price, action }: ListingCardShellProps) {
  return (
    <article className="group relative">
      <Link
        href={`/listings/${listingId}`}
        className="block rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
      >
        <div className="relative aspect-[5/4] overflow-hidden rounded-2xl bg-muted ring-1 ring-black/5">
          <Image
            src={getImageUrl(imagePath)}
            alt={title}
            fill
            sizes="(min-width: 1536px) 20vw, (min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 520px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
          />
        </div>

        <div className="mt-3 space-y-0.5 px-0.5">
          <h3 className="line-clamp-1 text-[15px] font-medium leading-snug">{title}</h3>
          {subtitle && <p className="line-clamp-1 text-sm text-muted-foreground">{subtitle}</p>}
          <p className="pt-1 text-sm">
            <span className="font-semibold">{formatPrice(price)}</span>
            <span className="text-muted-foreground"> night</span>
          </p>
        </div>
      </Link>

      {action && <div className="absolute right-3 top-3 z-10">{action}</div>}
    </article>
  );
}
