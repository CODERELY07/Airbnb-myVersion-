"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LayoutGrid, type LucideIcon } from "lucide-react";
import { categoryItems } from "../lib/categoryItems";
import { cn } from "@/lib/utils";

// Category filter bar. Always filters the home page
// (search results don't support categories).
export function MapFilterItems() {
  const active = useSearchParams().get("filter");

  return (
    <nav aria-label="Categories" className="border-b">
      <div className="page-container">
        <div className="no-scrollbar -mx-1 flex gap-7 overflow-x-auto px-1 sm:gap-9">
          <CategoryLink href="/" label="All" icon={LayoutGrid} active={!active} />
          {categoryItems.map((item) => (
            <CategoryLink
              key={item.id}
              href={`/?filter=${item.name}`}
              label={item.title}
              icon={item.icon}
              active={active === item.name}
            />
          ))}
        </div>
      </div>
    </nav>
  );
}

function CategoryLink({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex shrink-0 flex-col items-center gap-1.5 border-b-2 pb-3 pt-4 text-xs font-medium transition-colors outline-none focus-visible:text-foreground",
        active
          ? "border-foreground text-foreground"
          : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
      )}
    >
      <Icon className="size-[22px]" strokeWidth={1.5} />
      <span className="whitespace-nowrap">{label}</span>
    </Link>
  );
}
